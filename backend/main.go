package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

// http server types
type JoinRoomRequest struct {
	RoomID string `json:"roomId"`
}

// GameServer manages the overall game state and connections
type GameServer struct {
	rooms           map[string]*Room
	upgrader        websocket.Upgrader
	playerIDCounter int
	mu              sync.RWMutex
}

// Room represents a game room with connected players
type Room struct {
	id              string
	private         bool
	allowed_players []string
	players         map[int]*Player
	mu              sync.RWMutex
}

// Player represents a connected player
type Player struct {
	id              int
	name            string
	email           string
	roomId          string
	conn            *websocket.Conn
	position        Position
	isAuthenticated bool
}

// Position represents X,Y coordinates
type Position struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
}

// Message types
type (
	BaseMessage struct {
		Type string          `json:"messageType"`
		Data json.RawMessage `json:"data"`
	}

	PositionUpdate struct {
		ID       int      `json:"id"`
		Name     string   `json:"name"`
		Position Position `json:"position"`
	}

	ChatMessage struct {
		Id      int    `json:"id"`
		Name    string `json:"name"`
		Message string `json:"message"`
	}

	AuthMessage struct {
		JWT string `json:"jwt"`
	}

	ClientMessage struct {
		MessageType   string           `json:"messageType"`
		ID            int              `json:"id"`
		Position      Position         `json:"position"`
		Players       []PositionUpdate `json:"players"`
		Message       ChatMessage      `json:"message"`
		Name          string           `json:"name"`
		Authenticated bool             `json:"authenticated"`
		Error         string           `json:"error"`
		Answer        bool             `json:"answer"`
	}
)

func NewGameServer() *GameServer {
	return &GameServer{
		rooms: make(map[string]*Room),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

func (gs *GameServer) createRoom(id string) *Room {
	room := &Room{
		id:      id,
		players: make(map[int]*Player),
	}
	gs.mu.Lock()
	gs.rooms[id] = room
	gs.mu.Unlock()
	return room
}

func (gs *GameServer) getRoom(id string) *Room {
	gs.mu.RLock()
	defer gs.mu.RUnlock()
	return gs.rooms[id]
}

func (r *Room) addPlayer(player *Player) {
	r.mu.Lock()
	r.players[player.id] = player
	r.mu.Unlock()

	player.roomId = r.id
}

func (r *Room) removePlayer(id int) {
	r.mu.Lock()
	delete(r.players, id)
	r.mu.Unlock()

	// Notify other players about the disconnection
	r.broadcastExclusive(id, ClientMessage{
		MessageType: "player-left",
		ID:          id,
	})
}

// Exclude yourself from getting signal
func (r *Room) broadcastExclusive(sender int, msg interface{}) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for id, player := range r.players {
		if id != sender {
			return sendSecureMessage(player, msg)
		}
	}
	return nil
}

func (r *Room) broadcast(msg interface{}) error {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, player := range r.players {
		if err := sendSecureMessage(player, msg); err != nil {
			log.Printf("Error sending message: %v", err)
			return err
		}
	}
	return nil
}

func (r *Room) getPlayerPositions() []PositionUpdate {
	r.mu.RLock()
	defer r.mu.RUnlock()

	positions := make([]PositionUpdate, 0, len(r.players))
	for id, player := range r.players {
		positions = append(positions, PositionUpdate{
			ID:       id,
			Position: player.position,
			Name:     player.name,
		})
	}
	return positions
}

func sendSecureMessage(player *Player, message interface{}) error {
	if !player.isAuthenticated {
		player.conn.WriteJSON(ClientMessage{
			MessageType: "error",
			Error:       "player not authenticated",
		})
		return fmt.Errorf("player %v is not authenticated", player.id)
	}

	return player.conn.WriteJSON(message)
}

func validateHeaderJWT(r *http.Request) (*jwt.Token, error) {
	err := godotenv.Load()
	if err != nil {
		return nil, fmt.Errorf("error loading .env file: %v", err)
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, fmt.Errorf("missing authorization header")
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")

	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})
}

func (gs *GameServer) handleJoinRoom(w http.ResponseWriter, r *http.Request) {
	token, err := validateHeaderJWT(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	metadata := claims["user_metadata"].(map[string]interface{})
	userEmail := metadata["email"].(string)

	var req JoinRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	room := gs.getRoom(req.RoomID)
	if room == nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	if room.private {
		allowed := false
		for _, email := range room.allowed_players {
			if email == userEmail {
				allowed = true
				break
			}
		}
		if !allowed {
			http.Error(w, "Not allowed in private room", http.StatusForbidden)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"allowed": true,
		"roomId":  req.RoomID,
	})
}

func (gs *GameServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := gs.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// get supabase jwt secret
	err = godotenv.Load()
	if err != nil {
		log.Fatalf("Unable to load .env file: %v", err)
	}

	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")

	if jwtSecret == "" {
		log.Fatal("Enviornment variables are missing!")
	}

	var playerID int

	room := &Room{}
	player := Player{}

	// Main message loop
	for {
		var baseMsg BaseMessage
		if err := conn.ReadJSON(&baseMsg); err != nil {
			if websocket.IsCloseError(err,
				websocket.CloseNormalClosure,
				websocket.CloseGoingAway,
				websocket.CloseNoStatusReceived) {
				// Normal closure, just return silently
				return
			}

			// Log only unexpected errors
			log.Printf("Unexpected connection error: %v", err)
			return
		}

		switch baseMsg.Type {
		case "position":
			var posUpdate PositionUpdate
			if err := json.Unmarshal(baseMsg.Data, &posUpdate); err != nil {
				log.Printf("Position update parse error: %v", err)
				continue
			}

			player.position = posUpdate.Position
			room.broadcastExclusive(playerID, ClientMessage{
				MessageType: "remote-position",
				ID:          playerID,
				Position:    posUpdate.Position,
			})

		case "position-init":
			var posInit struct {
				Position Position `json:"position"`
			}
			if err := json.Unmarshal(baseMsg.Data, &posInit); err != nil {
				log.Printf("Position init parse error: %v", err)
				continue
			}
			player.position = posInit.Position

		case "chat":
			var message struct {
				Message string `json:"message"`
			}
			if err := json.Unmarshal(baseMsg.Data, &message); err != nil {
				log.Printf("Error parsing chat message json\n")
				return
			}
			room.broadcast(ClientMessage{
				MessageType: "chat",
				ID:          playerID,
				Message: ChatMessage{
					Id:      playerID,
					Message: message.Message,
					Name:    player.name,
				},
			})

		case "auth":
			var authObject AuthMessage

			if err := json.Unmarshal(baseMsg.Data, &authObject); err != nil {
				log.Println("Error parsing auth json")
				return
			}

			token, err := jwt.Parse(authObject.JWT, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("[ERROR] unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(jwtSecret), nil
			})

			if err != nil {
				log.Fatalf("Error decoding token: %v", err)
			}

			if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
				fmt.Println("Token is valid")
				metadata := claims["user_metadata"].(map[string]interface{})
				if metadata["email_verified"].(bool) {
					email := metadata["email"].(string)
					name := metadata["display_name"].(string)

					gs.mu.Lock()
					playerID = gs.playerIDCounter
					gs.playerIDCounter++
					gs.mu.Unlock()

					// Create new player
					player = Player{
						id:              playerID,
						conn:            conn,
						position:        Position{X: 5.5, Y: 3.75}, // Default position
						email:           email,
						name:            name,
						isAuthenticated: true,
					}

					cleanup := func() {
						conn.Close()
						room.removePlayer(playerID)
						fmt.Printf("[-] Player %v left\n", playerID)
					}
					defer cleanup()

					// The only place where you use WriteJSON everywhere else you use sendSecureMessage as it is a authenticated middleware
					conn.WriteJSON(ClientMessage{
						MessageType:   "auth",
						Authenticated: true,
					})

					// Send initial player data
					sendSecureMessage(&player, ClientMessage{
						MessageType: "id",
						ID:          playerID,
					})

				}
			} else {
				fmt.Println("Invalid token")
			}

		case "room":
			var roomId struct {
				RoomId string `json:"roomId"`
			}
			if err := json.Unmarshal(baseMsg.Data, &roomId); err != nil {
				log.Printf("Error parsing room message")
				return
			}

			// Create or get the default room
			room = gs.getRoom(roomId.RoomId)
			//  TODO: Do not just create a room whenever, it does not exist have a seprate page.
			if room == nil {
				sendSecureMessage(&player, ClientMessage{
					MessageType: "error",
					Error:       "room does not exist",
				})
				return
				// room = gs.createRoom(roomId.RoomId)
				// room.private = true
			}

			//  NOTE: idk seems kinda useless as every socket connection gets a new id
			if room.players[playerID] != nil {
				break
			}

			fmt.Println("room: ", roomId.RoomId)
			fmt.Printf("[+] Player %v has connected\n", playerID)

			is_player_allowed := true

			if room.private {
				is_player_allowed = false
				for _, email := range room.allowed_players {
					if player.email == email {
						is_player_allowed = true
						break
					}
				}
			}

			if !is_player_allowed {
				sendSecureMessage(&player, ClientMessage{
					MessageType: "error",
					Error:       "you are not allowed in the room, ask creator to add you or enter valid code.",
				})
				return
			}

			room.addPlayer(&player)
			defer room.removePlayer(playerID)

			fmt.Println("[*] positions: ", room.getPlayerPositions())

			// Send existing players to new player
			sendSecureMessage(&player, ClientMessage{
				MessageType: "players",
				Players:     room.getPlayerPositions(),
			})

			fmt.Println("player name: ", player.name)

			// Notify other players about new player
			room.broadcastExclusive(playerID, ClientMessage{
				MessageType: "add-player",
				ID:          playerID,
				Name:        player.name,
				Position:    player.position,
			})

		case "callConsentReq":
			var playerId struct {
				ID int `json:"id"`
			}

			if err := json.Unmarshal(baseMsg.Data, &playerId); err != nil {
				log.Println("error parsing callConsentReq json")
				break
			}

			gs.rooms[player.roomId].players[playerId.ID].conn.WriteJSON(ClientMessage{
				MessageType: "callConsentReq",
				ID:          playerID,
			})

		case "callConsentAns":
			var answer struct {
				ID     int  `json:"id"`
				Answer bool `json:"answer"`
			}

			if err := json.Unmarshal(baseMsg.Data, &answer); err != nil {
				log.Println("error parsing callConsentAns json")
				break
			}

			fmt.Printf("[*] callConsentAns: {%v, %v}\n", answer.ID, answer.Answer)

			gs.rooms["123"].players[answer.ID].conn.WriteJSON(ClientMessage{
				MessageType: "callConsentAns",
				Answer:      answer.Answer,
			})

		case "debug":
			fmt.Println("debug:")
			for key, _ := range gs.rooms["123"].players {
				fmt.Println("player: ", key)
			}
		}
	}
}

// Add this new middleware function
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*") // Adjust in production
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Pass down the request to the next handler
		next.ServeHTTP(w, r)
	}
}

func main() {
	server := NewGameServer()

	http.HandleFunc("/validate-room", enableCORS(server.handleJoinRoom))

	http.HandleFunc("/ws", enableCORS(server.handleWebSocket))

	port := "8080"
	fmt.Printf("Starting server on port %s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

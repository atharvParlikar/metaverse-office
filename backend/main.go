package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

// GameServer manages the overall game state and connections
type GameServer struct {
	rooms           map[string]*Room
	upgrader        websocket.Upgrader
	playerIDCounter int
	mu              sync.RWMutex
}

// Room represents a game room with connected players
type Room struct {
	id      string
	players map[int]*Player
	mu      sync.RWMutex
}

// Player represents a connected player
type Player struct {
	id              int
	name            string
	email           string
	conn            *websocket.Conn
	position        Position
	isAuthenticated bool
}

// Position represents X,Y coordinates
type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Message types
type (
	BaseMessage struct {
		Type string          `json:"messageType"`
		Data json.RawMessage `json:"data"`
	}

	PositionUpdate struct {
		ID       int      `json:"id"`
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
						position:        Position{X: 6, Y: 5}, // Default position
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
			if room == nil {
				room = gs.createRoom(roomId.RoomId)
			}

			if room.players[playerID] != nil {
				break
			}

			fmt.Println("room: ", roomId.RoomId)
			fmt.Printf("[+] Player %v has connected\n", playerID)

			room.addPlayer(&player)
			defer room.removePlayer(playerID)

			// Send existing players to new player
			sendSecureMessage(&player, ClientMessage{
				MessageType: "players",
				Players:     room.getPlayerPositions(),
			})

			// Notify other players about new player
			room.broadcastExclusive(playerID, ClientMessage{
				MessageType: "add-player",
				ID:          playerID,
				Position:    player.position,
			})

		case "debug":
			fmt.Println("debug:")
			for key, _ := range gs.rooms["123"].players {
				fmt.Println("player: ", key)
			}
		}
	}
}

func main() {
	server := NewGameServer()

	http.HandleFunc("/ws", server.handleWebSocket)

	port := "8080"
	fmt.Printf("Starting server on port %s\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

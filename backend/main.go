package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
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
	id       int
	conn     *websocket.Conn
	position Position
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

	ClientMessage struct {
		MessageType string   `json:"messageType"`
		ID          int      `json:"id"`
		Position    Position `json:"position"`
		Players     []Player `json:"players,omitempty"`
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
}

func (r *Room) broadcast(sender int, msg interface{}) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for id, player := range r.players {
		if id != sender {
			player.conn.WriteJSON(msg)
		}
	}
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

func (gs *GameServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := gs.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	gs.mu.Lock()
	playerID := gs.playerIDCounter
	gs.playerIDCounter++
	gs.mu.Unlock()

	// Create or get the default room
	room := gs.getRoom("default")
	if room == nil {
		room = gs.createRoom("default")
	}

	// Create new player
	player := &Player{
		id:       playerID,
		conn:     conn,
		position: Position{X: 6, Y: 5 + playerID}, // Default position
	}
	room.addPlayer(player)
	defer room.removePlayer(playerID)

	// Send initial player data
	conn.WriteJSON(ClientMessage{
		MessageType: "id",
		ID:          playerID,
	})

	// Send existing players to new player
	conn.WriteJSON(ClientMessage{
		MessageType: "players",
		Players:     room.getPlayerPositions(),
	})

	// Notify other players about new player
	room.broadcast(playerID, ClientMessage{
		MessageType: "add-player",
		ID:          playerID,
		Position:    player.position,
	})

	// Main message loop
	for {
		var baseMsg BaseMessage
		if err := conn.ReadJSON(&baseMsg); err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		switch baseMsg.Type {
		case "position":
			var posUpdate PositionUpdate
			if err := json.Unmarshal(baseMsg.Data, &posUpdate); err != nil {
				log.Printf("Position update parse error: %v", err)
				continue
			}

			player.position = posUpdate.Position
			room.broadcast(playerID, ClientMessage{
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


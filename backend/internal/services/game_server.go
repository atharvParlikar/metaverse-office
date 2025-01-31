package services

import (
	"sync"

	"github.com/gorilla/websocket"
)

type GameServer struct {
	rooms           map[string]*Room
	upgrader        websocket.Upgrader
	playerIDCounter int
	mu              sync.RWMutex
}

func NewGameServer() *GameServer {
	return &GameServer{
		rooms: make(map[string]*Room),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

func (gs *GameServer) CreateRoom(id string) *Room {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	room := &Room{
		id:      id,
		players: make(map[int]*Player),
	}
	gs.rooms[id] = room
	return room
}

func (gs *GameServer) GetRoom(id string) *Room {
	gs.mu.RLock()
	defer gs.mu.RUnlock()
	return gs.rooms[id]
}

func (gs *GameServer) Upgrade(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return gs.upgrader.Upgrade(w, r, nil)
}

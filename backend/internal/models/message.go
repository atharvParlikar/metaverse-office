package models

import (
	"encoding/json"
)

type JoinRoomRequest struct {
	RoomID string `json:"roomId"`
}

type BaseMessage struct {
	Type string          `json:"messageType"`
	Data json.RawMessage `json:"data"`
}

type PositionUpdate struct {
	ID       int      `json:"id"`
	Name     string   `json:"name"`
	Position Position `json:"position"`
}

type ChatMessage struct {
	Id      int    `json:"id"`
	Name    string `json:"name"`
	Message string `json:"message"`
}

type AuthMessage struct {
	JWT string `json:"jwt"`
}

type ClientMessage struct {
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

type Position struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
}

package handlers

import (
	"log"
	"net/http"

	"github.com/atharvparlikar/metaverse-office/backend/internal/models"
	"github.com/atharvparlikar/metaverse-office/backend/internal/services"
	"github.com/gorilla/websocket"
)

type WebSocketHandler struct {
	gameServer *services.GameServer
}

func NewWebSocketHandler(gs *services.GameServer) *WebSocketHandler {
	return &WebSocketHandler{gameServer: gs}
}

func (h *WebSocketHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := h.gameServer.Upgrade(w, r)
	if err != nil {
		log.Printf("Upgrade error: %v", err)
		return
	}
	defer conn.Close()

	var player *services.Player
	for {
		var msg models.BaseMessage
		if err := conn.ReadJSON(&msg); err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		switch msg.Type {
		case "auth":
			h.handleAuth(conn, &player, msg.Data)
		case "position":
			h.handlePosition(player, msg.Data)
			// Handle other message types
		}
	}
}

func (h *WebSocketHandler) handleAuth(conn *websocket.Conn, player **services.Player, data json.RawMessage) {
	var authMsg models.AuthMessage
	if err := json.Unmarshal(data, &authMsg); err != nil {
		log.Printf("Auth parse error: %v", err)
		return
	}

	// Validate JWT and create player
	*player = &services.Player{
		conn:            conn,
		isAuthenticated: true,
		// Set other fields from JWT claims
	}
}

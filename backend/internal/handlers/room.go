package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/atharvparlikar/metaverse-office/internal/auth"
	"github.com/atharvparlikar/metaverse-office/internal/models"
	"github.com/atharvparlikar/metaverse-office/internal/services"
)

type RoomHandler struct {
	gameServer *services.GameServer
}

func NewRoomHandler(gs *services.GameServer) *RoomHandler {
	return &RoomHandler{gameServer: gs}
}

func (h *RoomHandler) HandleJoinRoom(w http.ResponseWriter, r *http.Request) {
	token, err := auth.ValidateHeaderJWT(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	metadata := claims["user_metadata"].(map[string]interface{})
	userEmail := metadata["email"].(string)

	var req models.JoinRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	room := h.gameServer.GetRoom(req.RoomID)
	if room == nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	if room.private {
		allowed := false
		for _, email := range room.allowedPlayers {
			if email == userEmail {
				allowed = true
				break
			}
		}
		if !allowed {
			http.Error(w, "Not allowed", http.StatusForbidden)
			return
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"allowed": true,
		"roomId":  req.RoomID,
	})
}

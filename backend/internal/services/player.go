package services

import (
	"github.com/atharvparlikar/metaverse-office/internal/models"
	"github.com/gorilla/websocket"
)

type Player struct {
	id              int
	name            string
	email           string
	roomId          string
	conn            *websocket.Conn
	position        models.Position
	isAuthenticated bool
}

func (p *Player) Send(msg models.ClientMessage) error {
	if !p.isAuthenticated {
		return p.conn.WriteJSON(models.ClientMessage{
			MessageType: "error",
			Error:       "player not authenticated",
		})
	}
	return p.conn.WriteJSON(msg)
}

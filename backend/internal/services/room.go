package services

import (
	"sync"

	"github.com/atharvparlikar/metaverse-office/backend/internal/models"
)

type Room struct {
	id             string
	private        bool
	allowedPlayers []string
	players        map[int]*Player
	mu             sync.RWMutex
}

func (r *Room) AddPlayer(player *Player) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.players[player.id] = player
	player.roomId = r.id
}

func (r *Room) RemovePlayer(id int) {
	r.mu.Lock()
	delete(r.players, id)
	r.mu.Unlock()
	r.broadcastExclusive(id, models.ClientMessage{
		MessageType: "player-left",
		ID:          id,
	})
}

func (r *Room) Broadcast(msg models.ClientMessage) error {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, p := range r.players {
		if err := p.Send(msg); err != nil {
			return err
		}
	}
	return nil
}

func (r *Room) GetPlayerPositions() []models.PositionUpdate {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var positions []models.PositionUpdate
	for id, p := range r.players {
		positions = append(positions, models.PositionUpdate{
			ID:       id,
			Name:     p.name,
			Position: p.position,
		})
	}
	return positions
}

package main

import (
	"log"
	"net/http"

	"github.com/atharvparlikar/metaverse-office/backend/internal/handlers"
	"github.com/atharvparlikar/metaverse-office/backend/internal/middleware"
	"github.com/atharvparlikar/metaverse-office/backend/internal/services"
)

func main() {
	gs := services.NewGameServer()
	roomHandler := handlers.NewRoomHandler(gs)
	wsHandler := handlers.NewWebSocketHandler(gs)

	http.HandleFunc("/validate-room", middleware.EnableCORS(roomHandler.HandleJoinRoom))
	http.HandleFunc("/ws", middleware.EnableCORS(wsHandler.HandleWebSocket))

	log.Fatal(http.ListenAndServe(":8080", nil))
}

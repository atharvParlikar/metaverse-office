package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var connId int = 0
var connections = make(map[int]*websocket.Conn)
var rooms = make(map[string][]*websocket.Conn)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Input struct {
	ID        int      `json:"id"`
	DIRECTION []string `json:"direction"`
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println("error creating Upgrader")
		log.Println(err)
		return
	}
	defer conn.Close()

	connections[connId] = conn

	conn.WriteJSON(struct {
		ID           int    `json:"id"`
		MESSAGE_TYPE string `json:"messageType"`
	}{
		ID:           connId,
		MESSAGE_TYPE: "id",
	})

	conn.WriteJSON(struct {
		MESSAGE_TYPE string `json:"messageType"`
		POSITION     struct {
			X int `json:"x"`
			Y int `json:"y"`
		} `json:"position"`
	}{
		MESSAGE_TYPE: "position-init",
		POSITION: struct {
			X int `json:"x"`
			Y int `json:"y"`
		}{
			X: 6,
			Y: 5 + connId,
		},
	})

	connId++

	rooms["room1"] = append(rooms["room1"], conn)

	fmt.Println("[+] IP: ", conn.RemoteAddr(), " | connId: ", connId-1)

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println("error reading message")
			log.Println(err)
		}

		var input Input

		err = json.Unmarshal(message, &input)

		fmt.Println("parsed json: ", input)

		if err != nil {
			fmt.Println("Error parsing JSON: ", err)
		}

	}
}

func broadcast(roomId string, sender *websocket.Conn) {}

func main() {
	http.HandleFunc("/ws", handleWebSocket)

	rooms["room1"] = []*websocket.Conn{}

	port := "8080"
	fmt.Printf("Starting server on port %s\n\n", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Println("Error starting http server:")
		log.Println(err)
	}

}

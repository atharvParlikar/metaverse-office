/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { addSocketMessageEvent, getSocket } from "../util/socketChannel";
import { useStore } from "../util/store";

export type Chat = {
  id: number;
  message: string;
};

// TODO
// 1. write new Chat socket events in the backend |> DONE
// 2. write chat socket event listeners in here
// 3. keep history of chat in memory of backend or client (possibally also store in database but later)
// 4. Render the chat in some pixel art format so it matches the aesthetic

export const ChatPanel = () => {
  const socket = getSocket();
  const { id, chatHistory, addChat, setChatInputActive, wsReady } = useStore();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!socket) return;

    addSocketMessageEvent("chat", (parsedMessage) => {
      const msg: Chat = parsedMessage.message; // parsedMessage.message has same structure as Chat
      if (!id) return;
      addChat(msg);
      console.log(chatHistory);
    });
  }, [socket, id]);

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!socket) return null;
    if (!wsReady) return null;

    if (e.key === "Enter") {
      socket.send(
        JSON.stringify({
          messageType: "chat",
          data: {
            message,
          },
        }),
      );
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col justify-between">
      <div>
        <h1 className="text-2xl">Chat</h1>
        <div className="flex flex-col gap-2">
          {chatHistory.map((chat, index) => {
            return (
              <div key={index}>
                {chat.id}:<span>{chat.message}</span>
              </div>
            );
          })}
        </div>
      </div>
      <input
        onFocus={() => setChatInputActive(true)}
        onBlur={() => setChatInputActive(false)}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleSubmit}
        className="border-2 border-black rounded-md w-[92%] mx-[4%] p-1"
        placeholder="Chat..."
      />
    </div>
  );
};

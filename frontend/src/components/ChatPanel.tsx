/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { addSocketMessageEvent, getSocket } from "../util/socketChannel";
import { useStore } from "../util/store";

export type Chat = {
  id: number;
  name: string;
  message: string;
};

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
                {chat.name}:<span>{chat.message}</span>
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

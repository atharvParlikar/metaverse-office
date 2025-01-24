/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { addSocketMessageEvent, getSocket } from "../util/socketChannel";
import { useStore } from "../util/store";
import { Input } from "./ui/input";

export type Chat = {
  id: number;
  name: string;
  message: string;
};

export const ChatPanel = ({ className }: { className?: string }) => {
  const socket = getSocket();
  const { id, chatHistory, addChat, setChatInputActive, wsReady } = useStore();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!socket) return;

    addSocketMessageEvent("chat", (parsedMessage) => {
      console.log("parsedMessage: ", parsedMessage);
      const msg: Chat = parsedMessage.message; // parsedMessage.message has same structure as Chat
      if (!id) return;
      addChat(msg);
      console.log(chatHistory);
    });
  }, [socket, id]);

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!socket) return null;
    if (!wsReady) return null;

    if (message.length === 0) return;

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
    <div className={`${className} flex flex-col h-full`}>
      <h1 className="text-2xl mx-2">Chat</h1>
      <div className="h-full overflow-scroll">
        <div className="flex flex-col gap-2 p-2 my-2">
          {chatHistory.map((chat, index) => {
            console.log(chat.name);
            console.log(chat.message);
            return (
              <div key={index}>
                <span className="text-base">{chat.name}</span>
                {": "}
                <span className="text-base">{chat.message}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white">
        <Input
          onFocus={() => setChatInputActive(true)}
          onBlur={() => setChatInputActive(false)}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleSubmit}
          className="border-2 border-black w-[92%] mx-[4%] p-1 text-gray-600 my-4"
          placeholder="Chat..."
        />
      </div>
    </div>
  );
};

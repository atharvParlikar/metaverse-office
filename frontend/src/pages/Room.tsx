/* eslint-disable react-hooks/exhaustive-deps */
import { useRef, useEffect } from "react";

import { ChatPanel } from "../components/ChatPanel";
import { GameCanvas } from "../components/GameCanvas";
// import { useNavigate } from "react-router"; // this too
import { getSocket, initializeSocket } from "../util/socketChannel";
import { useStore } from "../util/store";
import { useNavigate } from "react-router";

export const Room = () => {
  const socketRef = useRef<WebSocket | null>(null);
  // const navigate = useNavigate(); // remember to use to later
  const roomIdSent = useRef<boolean>(false);
  const { wsReady, supabase } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, []);

  useEffect(() => {
    const roomId = localStorage.getItem("roomId");
    if (!roomId || roomId.length === 0) {
      navigate("/");
      return;
    }

    if (socketRef.current) return;
    const SOCKET_URL: string = import.meta.env.VITE_SOCKET_URL;
    initializeSocket(SOCKET_URL);
    socketRef.current = getSocket();
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;
    if (!wsReady) return;

    const roomId = localStorage.getItem("roomId");

    socketRef.current.send(
      JSON.stringify({
        messageType: "room",
        data: {
          roomId,
        },
      }),
    );

    roomIdSent.current = true;
  }, [socketRef, wsReady]);

  return (
    <div className="grid grid-cols-[4fr_1fr]">
      <GameCanvas />
      <ChatPanel />
    </div>
  );
};

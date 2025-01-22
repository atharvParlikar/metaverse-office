/* eslint-disable react-hooks/exhaustive-deps */
import { useRef, useEffect } from "react";

import { ChatPanel } from "../components/ChatPanel";
import { GameCanvas } from "../components/GameCanvas";
// import { useNavigate } from "react-router"; // this too
import {
  addSocketMessageEvent,
  getSocket,
  initializeSocket,
} from "../util/socketChannel";
import { useStore } from "../util/store";
import { useNavigate } from "react-router";

export const Room = () => {
  const socketRef = useRef<WebSocket | null>(null);
  // const navigate = useNavigate(); // remember to use to later
  const roomIdSent = useRef<boolean>(false);
  const { wsReady, supabase, wsAuthenticated, setWsAuthenticated } = useStore();
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

    const socket = socketRef.current;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // TODO: deal with this better, this shit is just returning
      if (error) return;
      if (!session) return;

      socket.send(
        JSON.stringify({
          messageType: "auth",
          data: {
            jwt: session.access_token,
          },
        }),
      );

      addSocketMessageEvent("auth", (parsedMessage) => {
        const { authenticated } = parsedMessage;
        if (authenticated) {
          setWsAuthenticated(true);
        }
      });
    });
  }, [socketRef, wsReady]);

  useEffect(() => {
    if (!wsAuthenticated) return;

    const socket = socketRef.current;
    const roomId = localStorage.getItem("roomId");

    socket?.send(
      JSON.stringify({
        messageType: "room",
        data: {
          roomId,
        },
      }),
    );

    roomIdSent.current = true;
  }, [wsAuthenticated]);

  return (
    <div className="grid grid-cols-[4fr_1fr]">
      <GameCanvas />
      <ChatPanel />
    </div>
  );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useStore } from "./store";

let socket: WebSocket | null;
const socketEvents = new Map<string, (e: MessageEvent<any>) => void>();

export const initializeSocket = (URL: string) => {
  socket = new WebSocket(URL);

  socket.onopen = () => {
    console.log("Socket connection open!");
    useStore.getState().setWsReady(true);
  };

  socket.onclose = () => {
    console.log("Socket connection close!");
  };

  socket.onerror = (err: any) => {
    console.error("Errar with socket connection:\n", err);
  };

  socket.onmessage = (e) => {
    const parsedMessage = JSON.parse(e.data);
    const { messageType } = parsedMessage;

    if (socketEvents.has(messageType)) {
      socketEvents.get(messageType)!(parsedMessage);
    }
  };

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return null;
  } else {
    return socket;
  }
};

export const addSocketMessageEvent = (
  name: string,
  callback: (e: any) => void,
) => {
  socketEvents.set(name, callback);
};

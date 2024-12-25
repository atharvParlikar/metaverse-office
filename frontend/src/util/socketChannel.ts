let socket: WebSocket | null;

export const initializeSocket = (URL: string) => {
  socket = new WebSocket(URL);

  socket.onopen = () => {
    console.log("Socket connection open!");
  };

  socket.onclose = () => {
    console.log("Socket connection close!");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket.onerror = (err: any) => {
    console.error("Errar with socket connection:\n", err);
  };

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("WebSocket not initialized yet, initialize it first!");
  } else {
    return socket;
  }
};

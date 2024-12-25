import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initializeSocket } from "./util/socketChannel.ts";

const SOCKET_URL = "http://localhost:8080/ws";

initializeSocket(SOCKET_URL);

createRoot(document.getElementById("root")!).render(<App />);

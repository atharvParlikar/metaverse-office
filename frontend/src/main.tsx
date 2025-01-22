import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import { Room } from "./pages/Room.tsx";
import { SignUp } from "./pages/SignUp.tsx";
import { Login } from "./pages/Login.tsx";

// Socket connection initialization
// const SOCKET_URL = "http://localhost:8080/ws";
// initializeSocket(SOCKET_URL);

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/room" element={<Room />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  </BrowserRouter>,
);

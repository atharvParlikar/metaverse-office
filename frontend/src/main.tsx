import { Toaster } from "react-hot-toast";

import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import { Room } from "./pages/Room.tsx";
import { SignUp } from "./pages/SignUp.tsx";
import { Login } from "./pages/Login.tsx";
import { ForgotPassword } from "./pages/ForgotPassword.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Socket connection initialization
// const SOCKET_URL = "http://localhost:8080/ws";
// initializeSocket(SOCKET_URL);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route
        path="/"
        element={
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        }
      />
      <Route path="/room" element={<Room />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgotPassword" element={<ForgotPassword />} />
      <Route path="/manage/account" element={<div />} />
    </Routes>
    <Toaster />
  </BrowserRouter>,
);

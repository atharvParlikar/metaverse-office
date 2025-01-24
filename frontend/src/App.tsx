/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import "./App.css";
import { useNavigate } from "react-router";
import { useStore } from "./util/store";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

function App() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const { supabase } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, []);

  const enter = () => {
    localStorage.setItem("roomId", roomId);
    navigate("/room");
  };

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl">Room ID</h1>
        <Input
          placeholder="123"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") enter();
          }}
        />
        <Button>Enter</Button>
      </div>
    </div>
  );
}

export default App;

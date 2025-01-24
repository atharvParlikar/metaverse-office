/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useNavigate } from "react-router";
import { useStore } from "./util/store";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Session } from "@supabase/supabase-js";
import toast from "react-hot-toast";

function App() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const { supabase } = useStore();
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
      else sessionRef.current = session;
    });
  }, []);

  // user can spam this but idk if I should rate limit this function
  const enter = () => {
    localStorage.setItem("roomId", roomId);
    if (!sessionRef.current?.user.email_confirmed_at) {
      toast.error("email not confirmed");
      return;
    }
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
        <Button onClick={enter}>Enter</Button>
      </div>
    </div>
  );
}

export default App;

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useNavigate } from "react-router";
import { useStore } from "./util/store";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Session } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { Label } from "./components/ui/label";
import { useQuery } from "@tanstack/react-query";

function App() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const { supabase } = useStore();
  const sessionRef = useRef<Session | null>(null);
  const { data, error, refetch } = useQuery({
    queryKey: ["roomValidity"],
    queryFn: async () => {
      const response = await fetch("http://localhost:8080/validate-room", {
        headers: {
          Authorization: `Bearer ${sessionRef.current?.access_token}`,
        },
      });
      return await response.json();
    },
    enabled: false,
    retry: false,
  });

  const toastPromise = () => {
    refetch();

    return toast.promise(
      new Promise((resolve, reject) => {
        if (error) {
          console.log(error.message);
          reject(error.message);
        } else {
          resolve(data);
        }
      }),
      {
        loading: "Loading user data...",
        success: "User data loaded successfully!",
        error: (err: string) => err,
      },
    );
  };

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
        <div>
          <Label className="text-xl">Room ID</Label>
          <Input
            placeholder="123"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") enter();
            }}
          />
        </div>
        <div className="flex gap-4">
          <Button disabled={!sessionRef.current} onClick={enter}>
            Enter
          </Button>
          <Button disabled={!sessionRef.current} onClick={toastPromise}>
            Create Room
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;

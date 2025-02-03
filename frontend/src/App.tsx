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
import axios from "axios";

type CreateRoomResponseT = {
  success: boolean;
  roomId: string;
  error: string;
};

type JoinRoomResponseT = {
  allowed: boolean;
  roomId: string;
};

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

  const handleJoinRoom = async () => {
    try {
      const response = await axios.post<JoinRoomResponseT>(
        "http://localhost:8080/validate-room",
        {
          roomId,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionRef.current?.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const { data } = response;

      if (data.allowed) {
        localStorage.setItem("roomId", data.roomId);
        navigate("/room");
      } else {
        console.log(data);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.status) {
        toast.error("Room does not exist!");
      }
    }
  };

  const handleCreateRoom = () => {
    const createRoomPromise = new Promise((resolve, reject) => {
      axios
        .post<CreateRoomResponseT>(
          "http://localhost:8080/create-room",
          {
            roomId,
          },
          {
            headers: {
              Authorization: `Bearer ${sessionRef.current?.access_token}`,
              "Content-Type": "application/json",
            },
          },
        )
        .then(({ data }) => {
          if (data.success) {
            resolve({ roomId: data.roomId });
          } else {
            reject(data.error);
          }
        })
        .catch((err: Error) => {
          reject(err.message);
        });
    });

    toast.promise(createRoomPromise, {
      success: "room created successfully",
      error: (err) => err,
      loading: "creating room...",
    });
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
          />
        </div>
        <div className="flex gap-4">
          <Button disabled={!sessionRef.current} onClick={handleJoinRoom}>
            Enter
          </Button>
          <Button disabled={!sessionRef.current} onClick={handleCreateRoom}>
            Create Room
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;

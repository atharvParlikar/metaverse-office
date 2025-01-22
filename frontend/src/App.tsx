/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import "./App.css";
import { useNavigate } from "react-router";
import { useStore } from "./util/store";

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
        <input
          placeholder="123"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") enter();
          }}
          className="p-1 w-60"
        />
        <button
          className="hover:bg-black hover:text-slate-50 rounded-md p-2 hover:shadow-[rgba(17,_17,_26,_0.1)_0px_0px_16px] w-fit"
          onClick={enter}
        >
          Enter
        </button>
      </div>
    </div>
  );
}

export default App;

import { useState } from "react";
import { useStore } from "../util/store";
import { useNavigate } from "react-router";

export const Login = () => {
  const [email, setMail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { supabase } = useStore();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("error occured while creating user:");
      console.error(error.message);
      return;
    }

    console.log("logged in successfully");
    navigate("/");
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center font-mono">
      <div className="flex flex-col gap-4 items-start">
        <div>
          <h1 className="text-xl">Login</h1>
          <div className="w-full h-[1px] bg-gray-400 my-4 " />
          <p>Email</p>
          <input
            value={email}
            onChange={(e) => setMail(e.target.value)}
            placeholder="you@mail.com"
            type="text"
            className="p-1 w-60"
          />
        </div>
        <div>
          <p>Password</p>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="******"
            type="password"
            className="p-1"
          />
        </div>

        <button
          className="hover:bg-black hover:text-slate-50 rounded-md p-2 shadow-[rgba(17,_17,_26,_0.1)_0px_0px_16px]"
          onClick={handleLogin}
        >
          login
        </button>
      </div>
    </div>
  );
};

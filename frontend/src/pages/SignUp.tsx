import { useState } from "react";
import { createClient } from "../util/supabase/client";
import { useNavigate } from "react-router";

export const SignUp = () => {
  const [email, setMail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const navigate = useNavigate();

  const handleSignUp = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
        },
      },
    });

    if (error) {
      console.error("error occured while creating user:");
      console.error(error.message);
      return;
    }

    navigate("/");
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center font-mono">
      <div className="flex flex-col gap-4 items-start">
        <h1 className="text-xl">Sign Up</h1>
        <div className="w-full h-[1px] bg-gray-400" />
        <div>
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
          <p>Username</p>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Atharv"
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
          className="hover:bg-black hover:text-slate-50  p-2 hover:shadow-[rgba(17,_17,_26,_0.1)_0px_0px_16px]"
          onClick={handleSignUp}
        >
          sign up
        </button>
      </div>
    </div>
  );
};

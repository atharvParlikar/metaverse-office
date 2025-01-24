import { useState } from "react";
import { useStore } from "../util/store";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import toast from "react-hot-toast";

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
      toast.error("Invalid username or password", {
        position: "top-right",
      });
      return;
    }

    console.log("logged in successfully");
    navigate("/");
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="flex flex-col gap-6 items-start w-80">
        <div className="w-full">
          <h1 className="font-press-start text-xl mb-4">Login</h1>
          <div className="w-full h-[2px] bg-[#1A1A1A] mb-6" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setMail(e.target.value)}
                placeholder="you@mail.com"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                type="password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
              />
            </div>
          </div>
        </div>
        <Button onClick={handleLogin} className="w-full">
          Login
        </Button>
      </div>
    </div>
  );
};

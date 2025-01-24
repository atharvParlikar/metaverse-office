import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import toast from "react-hot-toast";
import { useStore } from "../util/store";

export const SignUp = () => {
  const [email, setMail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { supabase } = useStore();

  const navigate = useNavigate();

  const handleSignUp = async () => {
    const userExists = await supabase
      .from("user_emails")
      .select("email")
      .eq("email", email);

    if (userExists.error) {
      console.log(userExists.error.message);
      toast.error("something went wrong please try again");
      return;
    }

    if (userExists.data && userExists.data.length > 0) {
      toast.error("email already registered");
      return;
    }

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
      toast.error(error.message);
      return;
    }

    navigate("/");
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="flex flex-col gap-6 items-start w-80">
        <div className="w-full">
          <h1 className="font-press-start text-xl mb-4">Sign Up</h1>
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
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Atharv"
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
                    handleSignUp();
                  }
                }}
              />
            </div>
          </div>
        </div>
        <Button onClick={handleSignUp} size="sm" className="w-full">
          Sign Up
        </Button>
      </div>
    </div>
  );
};

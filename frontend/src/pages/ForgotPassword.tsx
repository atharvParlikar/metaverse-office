/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import toast from "react-hot-toast";
import { useStore } from "../util/store";
import { create } from "zustand";
import { z } from "zod";

type localStoreT = {
  email: string;
  setEmail: (email: string) => void;

  otp: string;
  setOtp: (otp: string) => void;

  password: string;
  setPassword: (password: string) => void;

  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
};

const localStore = create<localStoreT>((set) => ({
  email: "",
  setEmail: (email: string) => set(() => ({ email })),

  otp: "",
  setOtp: (otp: string) => set(() => ({ otp })),

  password: "",
  setPassword: (password: string) => set(() => ({ password })),

  confirmPassword: "",
  setConfirmPassword: (confirmPassword: string) =>
    set(() => ({ confirmPassword })),
}));

const emailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Highlight the confirmPassword field
  });

function EmailField() {
  const { email, setEmail } = localStore();

  return (
    <>
      <Label>Email</Label>
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="w-fit border-2 border-black"
      />
    </>
  );
}

function OtpField() {
  const { otp, setOtp } = localStore();

  return (
    <>
      <Label>OTP</Label>
      <Input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="1234"
        className="w-fit border-2 border-black"
      />
    </>
  );
}

function ResetPasswordField() {
  const { password, setPassword, confirmPassword, setConfirmPassword } =
    localStore();

  return (
    <>
      <Label>Password</Label>
      <Input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="********"
        className="w-fit border-2 border-black"
        type="password"
      />
      <Label>Confirm Password</Label>
      <Input
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="********"
        className="w-fit border-2 border-black"
        type="password"
      />
    </>
  );
}

export function ForgotPassword() {
  const [currentField, setCurrentField] = useState<
    "email" | "otp" | "resetPassword"
  >("email");
  const { supabase } = useStore();
  const { email, otp, password, confirmPassword } = localStore();

  const handleSubmit = async () => {
    if (currentField === "email") {
      try {
        emailSchema.parse({ email });
      } catch (err: any) {
        toast.error(err.issues[0].message);
        return;
      }
      const supabasePromise = new Promise<string>((resolve, reject) => {
        supabase.auth.resetPasswordForEmail(email).then(({ error }) => {
          if (error) reject(error.message);
          else resolve("otp sent, check mail!");
        });
      });
      toast.promise(supabasePromise, {
        loading: "sending otp...",
        success: (data) => data,
        error: (error) => error,
      });
      setCurrentField("otp");
    } else if (currentField === "otp") {
      try {
        otpSchema.parse({ otp });
      } catch (err: any) {
        toast.error(err.issues[0].message);
        return;
      }

      const supabasePromise = new Promise<string>((resolve, reject) => {
        supabase.auth
          .verifyOtp({
            email,
            token: otp,
            type: "recovery",
          })
          .then(({ data, error }) => {
            if (error) {
              reject("Invalid OTP");
            }
            if (data.user) {
              resolve(`Logged in as: ${data.user.user_metadata.display_name}`);
              if (data.user) {
                setCurrentField("resetPassword");
              }
            }
          });
      });

      toast.promise(supabasePromise, {
        loading: "validating OTP",
        success: (data) => data,
        error: (error) => error,
      });
    } else if (currentField === "resetPassword") {
      try {
        passwordSchema.parse({ password, confirmPassword });
      } catch (err: any) {
        toast.error(err.issues[0].message);
        return;
      }
      const supabasePromise = new Promise((resolve, reject) => {
        supabase.auth.updateUser({ password }).then(({ error }) => {
          if (error) reject(error);
          else resolve("Password updated successfully");
        });
      });
      toast.promise(supabasePromise, {
        loading: "Changing password...",
        success: "Password updated successfully",
        error: (err) => err.message || "Failed to update password",
      });
      await supabasePromise; // Ensure the promise is awaited for proper flow
    }
  };

  const renderField = () => {
    if (currentField === "email") return <EmailField />;
    if (currentField === "otp") return <OtpField />;
    if (currentField === "resetPassword") return <ResetPasswordField />;
  };

  return (
    <div className="flex flex-col gap-4 h-screen w-screen justify-center items-center">
      <div className="flex flex-col">
        {renderField()}
        <Button onClick={handleSubmit} className="mt-4">
          Submit
        </Button>
      </div>
    </div>
  );
}

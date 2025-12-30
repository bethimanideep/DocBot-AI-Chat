"use client"
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import { Otp } from "@/app/components/otp";
import Link from "next/link";
import { useDispatch } from "react-redux"; // Import useSelector
import { setUploadedFiles, setUserId, setUsername } from "@/app/components/reduxtoolkit/socketSlice";
// Adjust the import path
interface LoginFormProps {
  className?: string;
  onClose: () => void; // Callback to close the popup
}
export function LoginForm({
  className,onClose,
  ...props
}: LoginFormProps) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [component, setComponent] = useState<"otp" | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent form reload
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "", data.message);
        if (data.message === "OTP sent to your email") {
          setComponent("otp"); // Set component state to 'otp'
        }else{
          dispatch(setUsername(data.username));
          dispatch(setUserId(data.userId));
          dispatch(setUploadedFiles(data.fileList));
          onClose();
        }
      } else {
        showToast("error", "", data.error);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("An error occurred. Please try again.");
    }

  };

  return (
    <div>
      {component === "otp" && <Otp email={email} onClose={onClose}/>} 
      {component === null && (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader className="text-center"></CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="grid gap-6">
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          href="/forgot-password"
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
"use client"
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import { Otp } from "@/app/components/otp";
// Callback to open forgot password modal is passed from parent
import { useDispatch } from "react-redux"; // Import useSelector
import { setUploadedFiles, setUserId, setUsername, setCurrentChatingFile } from "@/app/components/reduxtoolkit/socketSlice";
// Adjust the import path
interface LoginFormProps {
  className?: string;
  onClose: () => void; // Callback to close the popup
}
interface LoginFormPropsInternal extends LoginFormProps {
  onOpenForgot?: () => void;
}

export function LoginForm({
  className,onClose,onOpenForgot,
  ...props
}: LoginFormPropsInternal) {
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
        if (data.message === "OTP sent to your email") {
          showToast("success", "", data.message + " Please check your spam folder if you don't see it.");
          setComponent("otp"); // Set component state to 'otp'
        }else{
          showToast("success", "", data.message);
          dispatch(setUsername(data.username));
          dispatch(setUserId(data.userId));
          dispatch(setUploadedFiles(data.fileList));
          // If user has uploaded files on server, switch heading to Local Files
          if (data.fileList && data.fileList.length > 0) {
            dispatch(setCurrentChatingFile("Local Files"));
          }
          onClose();
        }
      } else {
        showToast("error", "", data.error);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      // Always reset submitting state so buttons are re-enabled on error/completion
      setIsSubmitting(false);
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
                        <button type="button" onClick={() => onOpenForgot?.()} className="ml-auto text-sm underline-offset-4 hover:underline">
                          Forgot your password?
                        </button>
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
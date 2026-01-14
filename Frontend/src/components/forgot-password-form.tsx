"use client"
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { showToast } from "@/lib/toast";
import { authService } from "@/lib/authService";

interface Props {
  onClose: () => void;
  onBack?: () => void;
}

export default function ForgotPasswordForm({ onClose, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      showToast("success", "", (data.message || "If an account exists, a reset link was sent.") + " Please check your spam folder if you don't see it.");
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast("error", "", err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" type="button" onClick={() => onBack ? onBack() : onClose()}>
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </div>
    </form>
  );
}

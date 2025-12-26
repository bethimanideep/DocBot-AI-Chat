import { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { showToast } from "@/lib/toast";
import { useDispatch, useSelector } from "react-redux"; // Import useSelector
import { setUserId, setUsername } from "./reduxtoolkit/socketSlice";

interface OtpProps {
  email: string; // Email passed from the parent component
}

export function Otp({ email ,onClose}: any) {
  const [otp, setOtp] = useState("");
  const dispatch = useDispatch(); // Initialize useDispatch

  // Function to handle OTP verification
  const verifyOtp = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      console.log("OTP Verification Response:", data);

      if (response.ok) {
        showToast("success", "", data.message);
        dispatch(setUsername(data.username));
        dispatch(setUserId(data.userId));
        onClose()
      } else {
        showToast("error", "", data.error);
      }
    } catch (error) {
      console.error("OTP Verification Error:", error);
      showToast("error", "", "An error occurred. Please try again.");
    }
  };

  // Automatically trigger OTP verification when OTP length is 6
  useEffect(() => {
    if (otp.length === 6) {
      verifyOtp();
    }
  }, [otp]);  

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-semibold">Enter OTP</h2>
      <InputOTP
        maxLength={6}
        value={otp}
        onChange={(value) => setOtp(value)}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-sm text-muted-foreground">
        Please enter the OTP sent to your email.
      </p>
    </div>
  );
}
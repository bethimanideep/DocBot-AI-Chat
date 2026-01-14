import { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { showToast } from "@/lib/toast";
import { useDispatch, useSelector } from "react-redux"; // Import useSelector
import { setUserId, setUsername, setUploadedFiles, setCurrentChatingFile } from "./reduxtoolkit/socketSlice";
import { fetchUserFiles } from "@/lib/files";
import { authService } from "@/lib/authService";

interface OtpProps {
  email: string; // Email passed from the parent component
}

export function Otp({ email, onClose }: any) {
  const [otp, setOtp] = useState("");
  const dispatch = useDispatch(); // Initialize useDispatch

  // Function to handle OTP verification
  const verifyOtp = async () => {
    try {
      const data = await authService.verifyOTP(email, otp);
      
      showToast("success", "", data.message);
      dispatch(setUsername(data.username));
      dispatch(setUserId(data.userId));
      
      onClose()
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      showToast("error", "", error.message || "An error occurred. Please try again.");
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
      <p className="text-xs text-muted-foreground text-center max-w-sm">
        📧 Can't find the email? Please check your spam/junk folder.
      </p>
    </div>
  );
}
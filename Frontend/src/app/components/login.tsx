import { User } from "lucide-react"; // Import the User icon
import { useSelector } from "react-redux"; // Import useSelector
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LoginForm } from "@/components/login-form";
// import { VisuallyHidden } from "@radix-ui/react-visually-hidden"; // Import VisuallyHidden
import { RootState } from "./reduxtoolkit/store";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function Login() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const username = useSelector((state: RootState) => state.socket.username); // Get username from Redux

  const handleClosePopup = () => {
    setIsPopupOpen(false); // Close the popup
  };

  return (
    <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
      <DialogTrigger asChild>
        <Button>
          {username ? ( // If username exists, show username with icon
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" /> {/* User icon */}
              <span>{username}</span> {/* Username */}
            </div>
          ) : (
            "Login" // If no username, show "Login"
          )}
        </Button>
      </DialogTrigger>
      {!username && (
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-xl font-semibold mb-2">
            Login
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 mb-4">
            Sign in to access your account and manage your files
          </DialogDescription>
          <div className="flex flex-col items-center justify-center gap-6 p-4">
            <div className="flex w-full max-w-sm flex-col gap-6">
              <LoginForm onClose={handleClosePopup} />
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

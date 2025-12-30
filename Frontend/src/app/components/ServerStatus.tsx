"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ServerStatus() {
  const [isChecking, setIsChecking] = useState(true);
  const [serverUp, setServerUp] = useState(false);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        setIsChecking(true);
        
        // Show loading notification
        const loadingToast = toast.loading("Checking server status...", {
          id: "server-check",
        });

        // Try to fetch from the server
        const response = await fetch("https://docbot-ai-chat.onrender.com/", {
          method: "GET",
          cache: "no-cache",
          headers: {
            "Accept": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.text();
          if (data.toLowerCase().includes("hi")) {
            setServerUp(true);
            toast.success("Server is ready!", {
              id: loadingToast,
              duration: 3000,
            });
          } else {
            throw new Error("Unexpected response");
          }
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (error) {
        console.error("Server check failed:", error);
        
        // Show spinning up notification
        toast.warning("Render server is spinning up, please wait...", {
          id: "server-spinning",
          duration: 5000, // Show for 5 seconds initially
        });

        // Retry logic - try 10 times with increasing delay
        let retries = 0;
        const maxRetries = 10;
        
        const retryCheck = async () => {
          if (retries >= maxRetries) {
            toast.error("Server is taking too long to start. Please refresh the page.", {
              id: "server-timeout",
              duration: 10000,
            });
            setIsChecking(false);
            return;
          }

          retries++;
          const delay = Math.min(1000 * Math.pow(2, retries), 30000); // Exponential backoff max 30s
          
          setTimeout(async () => {
            try {
              const response = await fetch("https://docbot-ai-chat.onrender.com/", {
                method: "GET",
                cache: "no-store",
              });

              if (response.ok) {
                const data = await response.text();
                if (data.toLowerCase().includes("hi")) {
                  setServerUp(true);
                  toast.success("Server is now ready!", {
                    id: "server-ready",
                    duration: 3000,
                  });
                  setIsChecking(false);
                } else {
                  retryCheck();
                }
              } else {
                retryCheck();
              }
            } catch (error) {
              retryCheck();
            }
          }, delay);
        };

        retryCheck();
      } finally {
        // After initial check, we can hide the loading state
        // (though retries might continue)
        setIsChecking(false);
      }
    };

    // Only check once on component mount
    checkServerStatus();
  }, []);

  // Don't render anything visible, just handle notifications
  return null;
}
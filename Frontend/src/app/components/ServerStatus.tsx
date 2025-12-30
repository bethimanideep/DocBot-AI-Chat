"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { showToast } from "@/lib/toast";

export default function ServerStatus() {
  const [isChecking, setIsChecking] = useState(true);
  const [serverUp, setServerUp] = useState(false);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        setIsChecking(true);
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
            showToast("success", "Render Server is ready!");
          } else {
            throw new Error("Unexpected response");
          }
        } else {
          throw new Error(`Server responded with status: ${response.status}`);
        }
      } catch (error) {
        console.error("Server check failed:", error);
        
        // Show spinning up notification
  
        showToast("warning", "Render server is spinning up, please wait...");

        // Retry logic - try 10 times with increasing delay
        let retries = 0;
        const maxRetries = 10;
        
        const retryCheck = async () => {
          if (retries >= maxRetries) {
            showToast("warning", "Render is taking too long to start. Please refresh the page.");
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
                  showToast("success", "Render Server is ready!");
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
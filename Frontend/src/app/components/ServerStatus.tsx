"use client";

import { useEffect } from "react";
import { toast } from "sonner";


export default function ServerStatus() {
  useEffect(() => {
    let toastId: string | number | null = null;

    const checkServer = async () => {
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL!, { method: "GET", cache: "no-store" });
        if (!res.ok) return;

        const text = await res.text();
        if (!text.toLowerCase().includes("hi")) return;

        if (toastId !== null) {
          toast.dismiss(toastId); // dismiss only if server responds correctly
        }
        toast.success(
          "Render server is ready!",
        );
      } catch (error) {
        // ignore errors
        toast.error("Error connecting to server.");
        console.log(error);
      }
    };

    // Show initial loading toast
    toastId = toast.warning(
      "Render server is spinning up, Please wait..",
      { duration: Infinity }
    );

    // Check server immediately
    checkServer();

    // Set interval to check every 14 minutes (840000 milliseconds)
    const interval = setInterval(checkServer, 840000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
      if (toastId !== null) {
        toast.dismiss(toastId);
      }
    };
  }, []);

  return null;
}

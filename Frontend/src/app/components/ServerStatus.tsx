"use client";

import { error } from "console";
import { useEffect } from "react";
import { toast } from "sonner";

const SERVER_URL = "https://docbot-ai-chat.onrender.com/";

export default function ServerStatus() {
  useEffect(() => {
    const toastId = toast.warning(
      "Render server is spinning up, Please wait..",
      { duration: Infinity }
    );

    const checkServer = async () => {
      try {
        const res = await fetch(SERVER_URL, { method: "GET", cache: "no-store" });
        if (!res.ok) return;

        const text = await res.text();
        if (!text.toLowerCase().includes("hi")) return;

        toast.dismiss(toastId); // dismiss only if server responds correctly
        toast.success(
          "Render server is ready!",
        );
      } catch (error) {
        // ignore errors
        toast.error("Error connecting to server.");
        console.log(error);
        
      }
    };

    checkServer(); // only one request
  }, []);

  return null;
}

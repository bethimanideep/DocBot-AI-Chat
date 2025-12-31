"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ServerStatus() {
  const [serverUp, setServerUp] = useState(false);

  useEffect(() => {
    let toastId: string | number | undefined;

    const checkServer = async () => {
      // Show persistent toast immediately
      toastId = toast("Render server is spinning up...", {
        description: "Please wait, first request may take 30–60s",
        duration: Infinity
      });

      try {
        const res = await fetch("https://docbot-ai-chat.onrender.com/", {
          method: "GET",
          cache: "no-store"
        });

        if (!res.ok) throw new Error(`Status: ${res.status}`);

        const text = await res.text();

        if (!text.toLowerCase().includes("hi")) {
          throw new Error("Unexpected response from server");
        }

        setServerUp(true);

        toast.dismiss(toastId);
        toast.success("Render Server is ready!");
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error("Render server failed to start", {
          description: err?.message || "Something went wrong"
        });
      }
    };

    checkServer();
  }, []);

  return null;
}

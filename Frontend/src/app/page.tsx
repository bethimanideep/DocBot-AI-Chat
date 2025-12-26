"use client";
import "./globals.css";
import Navbar from "./components/navbar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./components/reduxtoolkit/store";
import { Welcome } from "./components/welcome";
import { Chat } from "./components/chatdashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdjustableFileSidebar } from "./components/AdjustableFileSidebar";
import { FileSidebar } from "./components/fileSidebar";
import { setUserId, setUsername } from "./components/reduxtoolkit/socketSlice";
import { useEffect } from "react";

export default function Home() {
  const socketId = useSelector((state: RootState) => state.socket.socketId);
  const username = useSelector((state: RootState) => state.socket.username);
  const uploadedFiles = useSelector(
    (state: RootState) => state.socket.uploadedFiles
  );
  const dispatch = useDispatch();

  useEffect(() => {
    // Try fetching current user from backend (works for OAuth flow where server sets cookies)
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("https://docbot-ai-chat.onrender.com/auth/user", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.username && data.userId) {
            dispatch(setUsername(data.username));
            dispatch(setUserId(data.userId));
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }

      // Fallback: try reading simple non-HttpOnly cookies on the frontend
      try {
        const getCookie = (name: string) => {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1];
        };

        const cookieUsername = getCookie('username');
        const cookieUserId = getCookie('userId');

        if (cookieUsername && cookieUserId) {
          dispatch(setUsername(decodeURIComponent(cookieUsername)));
          dispatch(setUserId(decodeURIComponent(cookieUserId)));
        }
      } catch (err) {
        console.error("Failed to read cookies fallback:", err);
      }
    };

    fetchCurrentUser();
  }, [dispatch]);
  return (
    <main className="flex flex-col h-screen">

      <Navbar />
      <div className="flex-1 flex">
        {!username && uploadedFiles.length === 0 ? (
          <Welcome />
        ) : (
          <div className="flex flex-1">
            <div className="hidden lg:block">
              <FileSidebar />
            </div>
            <div className="flex-1 overflow-hidden">
              <Chat />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
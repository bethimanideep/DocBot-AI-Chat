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
    const getCookie = (name: string) => {
      return document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1];
    };
  
    try {
      const cookieUsername = getCookie('username');
      const cookieUserId = getCookie('userId');
  
      if (cookieUsername && cookieUserId) {
        dispatch(setUsername(decodeURIComponent(cookieUsername)));
        dispatch(setUserId(decodeURIComponent(cookieUserId)));
      }
    } catch (error) {
      console.error("Failed to read cookies:", error);
      // Fallback: Handle error (e.g., show a toast)
    }
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
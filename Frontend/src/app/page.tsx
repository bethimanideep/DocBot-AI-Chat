"use client";
import "./globals.css";
import Navbar from "./components/navbar";
import { useSelector } from "react-redux";
import { RootState } from "./components/reduxtoolkit/store";
import { Welcome } from "./components/welcome";
import { Chat } from "./components/chatdashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdjustableFileSidebar } from "./components/AdjustableFileSidebar";
import { FileSidebar } from "./components/fileSidebar";

export default function Home() {
  const socketId = useSelector((state: RootState) => state.socket.socketId);
  const username = useSelector((state: RootState) => state.socket.username);
  const uploadedFiles = useSelector(
    (state: RootState) => state.socket.uploadedFiles
  );

  return (
    <main className="flex flex-col h-screen">

      <Navbar />
      <div className="flex-1 flex overflow-hidden">
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
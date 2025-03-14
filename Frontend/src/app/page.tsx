"use client";
import "./globals.css";
import Navbar from "./components/navbar";
import { useSelector } from "react-redux";
import { RootState } from "./components/reduxtoolkit/store";
import { FileSidebar } from "./components/fileSidebar";
import { Welcome } from "./components/welcome";
import { Chat } from "./components/chatdashboard";

export default function Home() {
  const socketId = useSelector((state: RootState) => state.socket.socketId);
  const username = useSelector((state: RootState) => state.socket.username);
  const uploadedFiles = useSelector(
    (state: RootState) => state.socket.uploadedFiles
  );

  return (
    <main className="h-screen overflow-hidden">
      <Navbar />
      <div className="h-[calc(100vh-64px)]">
        {!username || uploadedFiles.length === 0 ? (
          <Welcome />
        ) : (
          <div className="flex">
            <div className="hidden lg:block w-[300px] min-w-[300px]">
              <FileSidebar />
            </div>
            <div className="flex-1">
              <Chat />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

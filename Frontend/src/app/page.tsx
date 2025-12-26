"use client";
import "./globals.css";
import Navbar from "./components/navbar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./components/reduxtoolkit/store";
import { Welcome } from "./components/welcome";
import { Chat } from "./components/chatdashboard";
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
    // Check for user data in localStorage
    const userData = localStorage.getItem("userData");
    
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData.username && parsedData.userId) {
          dispatch(setUsername(parsedData.username));
          dispatch(setUserId(parsedData.userId));
          return;
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    }

    // Fallback: Check URL parameters for OAuth callback data
    const searchParams = new URLSearchParams(window.location.search);
    const urlUsername = searchParams.get("username");
    const urlUserId = searchParams.get("userId");

    if (urlUsername && urlUserId) {
      // Save to localStorage
      const userData = {
        username: urlUsername,
        userId: urlUserId
      };
      localStorage.setItem("userData", JSON.stringify(userData));
      
      dispatch(setUsername(urlUsername));
      dispatch(setUserId(urlUserId));
      
      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
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
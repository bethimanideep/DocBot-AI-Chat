"use client";
import "./globals.css";
import Navbar from "./components/navbar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./components/reduxtoolkit/store";
import { Welcome } from "./components/welcome";
import { Chat } from "./components/chatdashboard";
import { FileSidebar } from "./components/fileSidebar";
import { setUserId, setUsername } from "./components/reduxtoolkit/socketSlice";
import { useEffect } from "react";

export default function Home() {
  const username = useSelector((state: RootState) => state.socket.username);
  const uploadedFiles = useSelector(
    (state: RootState) => state.socket.uploadedFiles
  );
  const dispatch = useDispatch();

  useEffect(() => {
    const getUrlParam = (name: string) => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    };

    try {
      // Check for URL parameters (from OAuth redirect)
      const urlUsername = getUrlParam('username');
      const urlUserId = getUrlParam('userId');

      if (urlUsername && urlUserId) {
        // Decode URL parameters
        const decodedUsername = decodeURIComponent(urlUsername);
        
        // Dispatch to Redux store
        dispatch(setUsername(decodedUsername));
        dispatch(setUserId(urlUserId));

        // Clear URL parameters from address bar
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        return;
      }

      // If no URL parameters, check localStorage for existing session
      const storedUsername = localStorage.getItem('username');
      const storedUserId = localStorage.getItem('userId');

      if (storedUsername && storedUserId) {
        dispatch(setUsername(storedUsername));
        dispatch(setUserId(storedUserId));
      }

    } catch (error) {
      console.error("Failed to process authentication:", error);
    }
  }, [dispatch]);
  
  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {!username && uploadedFiles.length === 0 ? (
          <Welcome />
        ) : (
          <div className="flex flex-1">
            <div className="hidden lg:block overflow-hidden">
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
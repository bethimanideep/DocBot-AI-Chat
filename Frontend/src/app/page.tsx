"use client";
import "./globals.css";
import Navbar from "./components/navbar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./components/reduxtoolkit/store";
import { Welcome } from "./components/welcome";
import { Chat } from "./components/chatdashboard";
import { FileSidebar } from "./components/fileSidebar";
import { setUserId, setUsername, setUploadedFiles, setCurrentChatingFile, setSocketId } from "./components/reduxtoolkit/socketSlice";
import { setDriveFiles, setDriveLoading, setDriveError } from "./components/reduxtoolkit/driveSlice";
import { useEffect } from "react";
import { fetchUserFiles, fetchDriveFiles } from "@/lib/files";
import { showToast } from "@/lib/toast";

// Generate or retrieve a unique session ID for the user
function getOrCreateSessionId(): string {
  const storageKey = 'userSessionId';
  let sessionId = localStorage.getItem(storageKey);

  if (!sessionId) {
    // Generate a unique ID using crypto.randomUUID() if available, otherwise use a timestamp-based ID
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      sessionId = crypto.randomUUID();
    } else {
      // Fallback: timestamp + random number
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    localStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

export default function Home() {
  const username = useSelector((state: RootState) => state.socket.username);
  const userId = useSelector((state: RootState) => state.socket.userId);
  const socketId = useSelector((state: RootState) => state.socket.socketId);
  const uploadedFiles = useSelector(
    (state: RootState) => state.socket.uploadedFiles
  );
  const dispatch = useDispatch();

  // Generate and set unique session ID for the user
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    if (!socketId || socketId !== sessionId) {
      dispatch(setSocketId(sessionId));
    }
  }, [dispatch, socketId]);

  // Handle URL parameters (from OAuth redirect)
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
      }
    } catch (error) {
      console.error("Failed to process URL parameters:", error);
    }
  }, [dispatch]);

  // Fetch files whenever user is logged in (username and userId exist)
  // This handles both initial login and page reloads (when Redux-persist rehydrates)
  useEffect(() => {
    // Only fetch if user is logged in and files haven't been loaded yet
    if (username && userId) {
      const fetchFiles = async () => {
        const files = await fetchUserFiles();
        if (files !== null) {
          dispatch(setUploadedFiles(files as any));
          if (files && files.length > 0) {
            dispatch(setCurrentChatingFile("Local Files"));
          }
        } else {
          // If fetch returns null, it might be due to token expiration
          // Check if we should clear user state (this will be handled by the fetch function's error handling)
          showToast("error", "Session Expired", "Your session has expired. Please login again.");
          dispatch(setUsername(null));
          dispatch(setUploadedFiles([] as any));
          dispatch(setUserId(null));
          dispatch(setDriveFiles([] as any));
        }
      };
      fetchFiles();
    }
  }, [username, userId, dispatch]); // Fetch when username or userId changes

  // Fetch Google Drive files whenever user is logged in
  // This handles both initial login and page reloads
  useEffect(() => {
    if (username && userId) {
      const fetchDrive = async () => {
        dispatch(setDriveLoading(true));
        dispatch(setDriveError(null));

        const driveFiles = await fetchDriveFiles();
        if (driveFiles !== null) {
          dispatch(setDriveFiles(driveFiles as any));
        } else {
          // If fetch fails (e.g., no Google Drive token or token expired), set empty array
          // showToast("error", "Session Expired", "Your session has expired. Please login again.");
          // dispatch(setUsername(null));
          // dispatch(setUploadedFiles([] as any));
          // dispatch(setUserId(null));
          dispatch(setDriveFiles([] as any));
          // Error handling for token expiration is done in fetchDriveFiles function
        }
      };
      fetchDrive();
    }
  }, [username, userId, dispatch]); // Fetch when username or userId changes

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
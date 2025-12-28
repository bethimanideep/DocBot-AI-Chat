"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "@/lib/toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RootState } from "./reduxtoolkit/store";
import { setSocketId, setUploadedFiles, setProgress, setIsLoading, setCurrentChatingFile, setUsername, setUserId } from "./reduxtoolkit/socketSlice";
import { setDriveFiles } from "./reduxtoolkit/driveSlice";
import { toast } from "sonner";

interface WelcomeProps {
  onGetStarted: () => void;
}

interface FileSyncCompleteEvent {
  fileId: string;
  synced: boolean;
  _id: string;
}


const Upload = () => {
  const socketId = useSelector((state: RootState) => state.socket.socketId);
  const isLoading = useSelector((state: RootState) => state.socket.isLoading);
  const userId = useSelector((state: RootState) => state.socket.userId);
  const driveFiles = useSelector((state: RootState) => state.drive.driveFiles);
  const driveFilesRef = useRef(driveFiles);
  const dispatch = useDispatch();
  const existingSocket = useSelector((state: RootState) => state.socket.socketInstance as any);
  const uploadUrl = userId
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload?userId=${userId}`
    : `${process.env.NEXT_PUBLIC_BACKEND_URL}/myuserupload?socketId=${socketId}`;

  useEffect(() => {
    driveFilesRef.current = driveFiles;
  }, [driveFiles]);

  useEffect(() => {
    console.log("Before:", driveFiles);
    // Attach listeners to the shared socket instance (provided by Providers)
    const sock = (window as any).__DOCBOT_SOCKET__ as any | undefined || existingSocket;
    if (!sock) return; // Providers will create it; this effect will run again when sock becomes available on remount

    // Ensure we don't attach duplicate listeners
    sock.off("driveFilesResponse");
    sock.off("fileSyncStatusUpdate");
    sock.off("initialFileList");

    sock.on('fileSyncStatusUpdate', ({ fileId, synced, _id }: FileSyncCompleteEvent) => {
      console.log("received response");
      const updatedFiles = driveFilesRef.current.map((f: any) =>
        f.id === fileId ? { ...f, synced, _id } : f
      );
      dispatch(setDriveFiles(updatedFiles));
      showToast("success", "Sync Complete", `Sync Completed successfully`);
    });

    sock.on("driveFilesResponse", (data: any) => {
      if (data.error) {
        console.log(data.error);
      } else {
        if (data.driveFiles && data.driveFiles.length > 0) dispatch(setCurrentChatingFile("Gdrive"));
        dispatch(setDriveFiles(data.driveFiles));
        console.log("Received drive files:", data.driveFiles);
      }
    });

    sock.on("initialFileList", async (data: any) => {
      if (data.error) {
        console.log("Error fetching initial files:", data.error);
        if (data.error == "Invalid or expired token") {
          showToast("error", "Session Expired", data.error);
          try {
            console.log('Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, {
              method: "POST",
              credentials: "include",
            });
            const data = await response.json();
            if (response.ok) {
              console.log(data);
              dispatch(setUsername(null));
              dispatch(setUploadedFiles([] as any));
              dispatch(setUserId(null));
              dispatch(setDriveFiles([] as any));
            } else {
              console.error("Logout failed");
            }
          } catch (error) {
            console.error("Error during logout:", error);
          }

        }
      } else {
        if (data.fileList.length > 0) dispatch(setCurrentChatingFile("Local Files"));
        dispatch(setUploadedFiles(data.fileList));
        console.log("Received initial file list:", data.fileList);
      }
    });

    // Also ensure progressbar and connect handlers are set
    sock.off("progressbar");
    sock.on("progressbar", (message: any) => {
      console.log(message);
      dispatch(setProgress(message));
    });

    if (sock.connected) {
      dispatch(setSocketId((sock.id as unknown) as string));
      if (userId) sock.emit('joinRoom', userId);
    } else {
      sock.on('connect', () => {
        dispatch(setSocketId((sock.id as unknown) as string));
        if (userId) sock.emit('joinRoom', userId);
      });
    }

    return () => {
      // leave socket open for other components
      try {
        sock.off('driveFilesResponse');
        sock.off('fileSyncStatusUpdate');
        sock.off('initialFileList');
        sock.off('progressbar');
      } catch (e) { }
    };
  }, [dispatch, existingSocket, userId]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setIsLoading(true));
    console.log({ isLoading });
    dispatch(setProgress(25));

    const files = event.target.files;
    if (!files || files.length === 0 || !socketId) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    formData.append("socketId", socketId);


    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log({ data });

      if (response.ok) {
        dispatch(setUploadedFiles(data.fileList));
        showToast("success", "", "Uploaded Successfully");
        dispatch(setCurrentChatingFile("Local Files"));
      } else {
        showToast("error", "Upload Failed", data.message);
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      showToast(
        "warning",
        "Internal Error",
        error.message || "An unexpected error occurred."
      );
    } finally {
      dispatch(setIsLoading(false));
      dispatch(setProgress(0));
    }
  };

  return (
    <div className="">
      <div className="flex flex-col items-center gap-4">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          onChange={handleFileUpload}
          disabled={isLoading}
        />

        <label htmlFor="file-upload">
          <Button asChild variant="outline" disabled={isLoading}>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Upload Files"
              )}
            </div>
          </Button>
        </label>
      </div>
    </div>
  );
};

export default Upload;

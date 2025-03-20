"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import io from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "@/lib/toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { RootState } from "./reduxtoolkit/store";
import { setSocketId, setUploadedFiles ,setProgress,setIsLoading, setSocketInstance} from "./reduxtoolkit/socketSlice";
import { setDriveFiles } from "./reduxtoolkit/driveSlice";

const Upload = () => {
  const dispatch = useDispatch();
  const socketId = useSelector((state: RootState) => state.socket.socketId);
  const isLoading = useSelector((state: RootState) => state.socket.isLoading);
  const userId = useSelector((state: RootState) => state.socket.userId);
  const uploadUrl = userId 
  ? `http://localhost:4000/upload?userId=${userId}` 
  : `http://localhost:4000/myuserupload?socketId=${socketId}`;
  useEffect(() => {
    const newSocket: any = io("http://localhost:4000",{withCredentials:true});
    newSocket.on("connect", () => {
      dispatch(setSocketId(newSocket.id));
      console.log("Connected with socket ID:", newSocket.id);
    });

    newSocket.on("progressbar", (message: any) => {
      console.log(message);
      dispatch(setProgress(message));
    });
    newSocket.on("driveFilesResponse", (data: any) => {
      if (data.error) {
        console.log(data.error);
        
      } else {
        dispatch(setDriveFiles(data.pdfFiles));
        console.log("Received drive files:", data.pdfFiles);
      }
    });
     // Listen for initial file list after connecting
  newSocket.on("initialFileList", (data: any) => {
    if (data.error) {
      console.log("Error fetching initial files:", data.error);
    } else {
      dispatch(setUploadedFiles(data.fileList));
      console.log("Received initial file list:", data.fileList);
    }
  });
    

    return () => {
      newSocket.disconnect();
    };
  }, [dispatch]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setIsLoading(true));
    console.log({isLoading});
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
    console.log({data});
    
    if (response.ok) {
      dispatch(setUploadedFiles(data.fileList));
      showToast("success", "Uploaded successfully", data.message);
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

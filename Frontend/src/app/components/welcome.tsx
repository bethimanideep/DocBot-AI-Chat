import React, { ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { RootState } from './reduxtoolkit/store';
import { useDispatch, useSelector } from 'react-redux';
import io from "socket.io-client";
import { setSocketId, setUploadedFiles ,setProgress,setIsLoading, setSocketInstance} from "./reduxtoolkit/socketSlice";
import { setDriveFiles } from "./reduxtoolkit/driveSlice";
import { showToast } from '@/lib/toast';




export const Welcome = () => {
  const dispatch = useDispatch();
  const socketId = useSelector((state: RootState) => state.socket.socketId);
  const isLoading = useSelector((state: RootState) => state.socket.isLoading);
  const userId = useSelector((state: RootState) => state.socket.userId);
  const driveFiles = useSelector((state: RootState) => state.drive.driveFiles);
  const uploadUrl = userId 
  ? `https://docbot-ai-chat.onrender.com/upload?userId=${userId}` 
  : `https://docbot-ai-chat.onrender.com/myuserupload?socketId=${socketId}`;
  useEffect(() => {
    const newSocket: any = io("https://docbot-ai-chat.onrender.com",{withCredentials:true});
    newSocket.on("connect", () => {
      dispatch(setSocketId(newSocket.id));
      console.log("Connected with socket ID:", newSocket.id);
      console.log({userId});
      
      // Join room after connection is established
      if (userId) {
        newSocket.emit('joinRoom', userId);
        console.log(`Attempting to join room ${userId}`);
      }
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
    <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
          <div className="relative bg-white p-4 rounded-full shadow-xl">
            <MessageSquare className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
        Welcome to Drive Chat
      </h1>
      
      <p className="text-xl text-gray-700 mb-8 leading-relaxed">
        Your smart file companion that makes document conversations simple and productive.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <FileText className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Access Documents</h3>
          <p className="text-gray-600">Easily find and interact with all your important files</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <MessageSquare className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Chat with Files</h3>
          <p className="text-gray-600">Ask questions and discuss any part of your documents</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <Sparkles className="w-8 h-8 text-amber-500 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Smart Insights</h3>
          <p className="text-gray-600">Get summaries and key information automatically</p>
        </div>
      </div>

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
          <Button asChild variant="outline" disabled={isLoading} className="px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
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
      
      <p className="text-gray-500 mt-6">
        Select any file from the sidebar to begin your document conversation
      </p>
    </div>
  );
};
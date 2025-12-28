import React, { ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Heart, Laugh, Loader2, MessageSquare, Smile, SmilePlus, Sparkles } from 'lucide-react';
import { RootState } from './reduxtoolkit/store';
import { useDispatch, useSelector } from 'react-redux';
import io from "socket.io-client";
import { setSocketId, setUploadedFiles, setProgress, setIsLoading, setSocketInstance } from "./reduxtoolkit/socketSlice";
import { setDriveFiles } from "./reduxtoolkit/driveSlice";
import { showToast } from '@/lib/toast';

export const Welcome = () => {
  const dispatch = useDispatch();
  const socketId = useSelector((state: RootState) => state.socket.socketId);
  const isLoading = useSelector((state: RootState) => state.socket.isLoading);
  const userId = useSelector((state: RootState) => state.socket.userId);
  const driveFiles = useSelector((state: RootState) => state.drive.driveFiles);
  const uploadUrl = userId
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload?userId=${userId}`
    : `${process.env.NEXT_PUBLIC_BACKEND_URL}/myuserupload?socketId=${socketId}`;

  useEffect(() => {
    const newSocket: any = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, { withCredentials: true });
    newSocket.on("connect", () => {
      dispatch(setSocketId(newSocket.id));
      console.log("Connected with socket ID:", newSocket.id);
      console.log({ userId });

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


    return () => {
      newSocket.disconnect();
    };
  }, [dispatch]);

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
    <div className="flex-1 overflow-y-auto"> {/* Added this wrapper for scroll */}
      <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto p-4 sm:p-6 md:p-8 min-h-full">
        <div className="mb-6 sm:mb-8 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
            <div className="relative bg-white p-3 sm:p-4 rounded-full shadow-xl">
              <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500 animate-bounce fill-red-500 hover:animate-pulse" />Welcome to DocBot<Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500 animate-bounce fill-red-500 hover:animate-pulse" />
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 leading-relaxed">
          Your smart file companion that makes document conversations simple and productive.
        </p>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 w-full">
  <div className="bg-white dark:bg-[#101626] p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 dark:border-white/10 hover:shadow-lg transition-shadow">
    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2 sm:mb-3" />
    <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-900 dark:text-white">
      Access Documents
    </h3>
    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
      Easily find and interact with all your important files
    </p>
  </div>

  <div className="bg-white dark:bg-[#101626] p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 dark:border-white/10 hover:shadow-lg transition-shadow">
    <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mb-2 sm:mb-3" />
    <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-900 dark:text-white">
      Chat with Files
    </h3>
    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
      Ask questions and discuss any part of your documents
    </p>
  </div>

  <div className="bg-white dark:bg-[#101626] p-4 sm:p-6 rounded-xl shadow-md border border-gray-100 dark:border-white/10 hover:shadow-lg transition-shadow">
    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mb-2 sm:mb-3" />
    <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-900 dark:text-white">
      Smart Insights
    </h3>
    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
      Get summaries and key information automatically
    </p>
  </div>
</div>


        <div className="w-full max-w-sm sm:max-w-md">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              onChange={handleFileUpload}
              disabled={isLoading}
            />

            <label htmlFor="file-upload" className="w-full">
              <Button
                asChild
                variant="outline"
                disabled={isLoading}
                className="w-full px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload Files</span>
                  )}
                </div>
              </Button>
            </label>
          </div>
        </div>

        <p className="text-sm sm:text-base text-gray-500 mt-4 sm:mt-6">
          Select any file from the sidebar to begin your document conversation
        </p>
      </div>
    </div>
  );
};
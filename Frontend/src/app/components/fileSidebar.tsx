import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Image,
  FileSpreadsheet,
  Repeat,
  Loader2,
  Check,
  Folder,
  HardDrive,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RootState } from "./reduxtoolkit/store";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentChatingFile, setFileId } from "./reduxtoolkit/socketSlice";
import {
  setDriveFiles,
  setDriveLoading,
  setDriveError,
} from "./reduxtoolkit/driveSlice";
import { showToast } from "@/lib/toast";

interface FileData {
  _id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
}

interface FileSidebarProps {
  onFileSelect?: (file: FileData) => void;
  onFileClick?: () => void;
}

export const FileSidebar = ({ onFileSelect, onFileClick }: FileSidebarProps) => {
  const dispatch = useDispatch();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const uploadedFiles = useSelector(
    (state: RootState) => state.socket.uploadedFiles
  );
  const userId = useSelector((state: RootState) => state.socket.userId);
  const driveFiles = useSelector((state: RootState) => state.drive.driveFiles);
  const driveLoading = useSelector((state: RootState) => state.drive.isLoading);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const sidebarWidth = useRef(374);

  const handleSyncFile = async (fileId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  
    // Don't sync if already synced
    const file = driveFiles.find((f: any) => f.id === fileId);
    if (file && (file as any).synced) return;
  
    // Set loading state for this file
    setLoadingFiles((prev) => ({ ...prev, [fileId]: true }));
  
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/gdrive/sync?fileId=${fileId}&userId=${userId}`,
        {
          credentials: "include",
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to sync file");
      }
  
      const data = await response.json();
      showToast("success", "File Synced", "File Sync Successful");
  
    } catch (error: any) {
      showToast("error", "Sync Failed", error.message);
      console.error("Error syncing file:", error);
    } finally {
      // Remove loading state
      setLoadingFiles((prev) => ({ ...prev, [fileId]: false }));
    }
  };
  

  const fetchDriveFiles = async () => {
    if(!userId){
      showToast("error", "Login Required", "");
      return;
    }
    try {
      dispatch(setDriveLoading(true));

      // Fetch PDF files from Google Drive
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/drive/files?userId=${userId}`,
        {
          credentials: "include", // Include cookies for authentication
        }
      );

      if (!response.ok) {
        initiateGoogleDriveAuth();
        return;
      }
      showToast("success", "", "Connected To Google Drive");

      const data = await response.json();
      dispatch(setDriveFiles(data.pdfFiles));
    } catch (error) {
      console.log({ error });
    } finally {
      dispatch(setDriveLoading(false));
    }
  };

  const initiateGoogleDriveAuth = () => {
    // Redirect to authenticate Google Drive
    window.location.href =
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/drive?redirect=true`;
  };

  const handleGoogleDriveLogout = async () => {
    try {
      // Call backend to revoke Google Drive access
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/drivelogout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        // Clear Google Drive files from Redux store
        dispatch(setDriveFiles([]));
        showToast("success", "Logged Out", "Disconnected from Google Drive");
      } else {
        // Even if backend fails, clear local state
        dispatch(setDriveFiles([]));
        showToast("info", "Disconnected", "Google Drive connection cleared locally");
      }
    } catch (error) {
      console.error("Error logging out from Google Drive:", error);
      // Still clear local state on error
      dispatch(setDriveFiles([]));
      showToast("info", "Disconnected", "Google Drive connection cleared");
    }
  };
  
  // Mouse event handlers
  const startDraggingMouse = (event: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = event.clientX;
    document.addEventListener("mousemove", onDraggingMouse);
    document.addEventListener("mouseup", stopDraggingMouse);
  };

  const onDraggingMouse = (event: MouseEvent) => {
    if (!isDragging.current || !sidebarRef.current) return;
    const deltaX = event.clientX - startX.current;
    let newWidth = sidebarWidth.current + deltaX;
    newWidth = Math.max(200, Math.min(newWidth, 600));
    sidebarRef.current.style.width = `${newWidth}px`;
    currentX.current = newWidth;
  };

  const stopDraggingMouse = () => {
    isDragging.current = false;
    sidebarWidth.current = currentX.current;
    document.removeEventListener("mousemove", onDraggingMouse);
    document.removeEventListener("mouseup", stopDraggingMouse);
  };

  // Touch event handlers for mobile
  const startDraggingTouch = (event: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = event.touches[0].clientX;
    document.addEventListener("touchmove", onDraggingTouch, { passive: false });
    document.addEventListener("touchend", stopDraggingTouch);
  };

  const onDraggingTouch = (event: TouchEvent) => {
    if (!isDragging.current || !sidebarRef.current) return;
    event.preventDefault(); // Prevent scrolling while dragging
    const deltaX = event.touches[0].clientX - startX.current;
    let newWidth = sidebarWidth.current + deltaX;
    newWidth = Math.max(200, Math.min(newWidth, 600));
    sidebarRef.current.style.width = `${newWidth}px`;
    currentX.current = newWidth;
  };

  const stopDraggingTouch = () => {
    isDragging.current = false;
    sidebarWidth.current = currentX.current;
    document.removeEventListener("touchmove", onDraggingTouch);
    document.removeEventListener("touchend", stopDraggingTouch);
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", onDraggingMouse);
      document.removeEventListener("mouseup", stopDraggingMouse);
      document.removeEventListener("touchmove", onDraggingTouch);
      document.removeEventListener("touchend", stopDraggingTouch);
    };
  }, []);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("image")) {
      return <Image className="w-4 h-4 text-green-500 dark:text-green-400" />;
    } else if (mimeType.includes("spreadsheet")) {
      return (
        <FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
      );
    } else {
      return <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleLocalFileClick = (file: any) => {
    dispatch(setCurrentChatingFile(file.filename));
    dispatch(setFileId(file._id));
    setSelectedFileId(file._id);
    onFileClick?.();
  };

  const handleDriveFileClick = (file: any) => {
    if(file.synced) {
      dispatch(setCurrentChatingFile(file.name));
      dispatch(setFileId(file._id));
      setSelectedFileId(file.id);
      onFileClick?.();
    } else {
      showToast("error", "Sync File", "File is not in Sync");
    }
  };

  const handleDriveFileTouch = (file: any, e: React.TouchEvent) => {
    e.stopPropagation();
    if(file.synced) {
      dispatch(setCurrentChatingFile(file.name));
      dispatch(setFileId(file._id));
      setSelectedFileId(file.id);
      onFileClick?.();
    } else {
      showToast("error", "Sync File", "File is not in Sync");
    }
  };

  return (
    <div
      ref={sidebarRef}
      className="bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-700 shadow-xl relative flex flex-col h-full select-none"
      style={{ width: `${sidebarWidth.current}px`, transition: "none" }}
    >
      {/* Header - fixed height */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white shrink-0">
        <h2 className="text-xl font-bold">Files</h2>
        <p className="text-sm opacity-75 mt-1">Manage your documents</p>
      </div>

      {/* Files Container - scrollable area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Local Files Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 mr-3">
                <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                Local Files
              </h3>
            </div>
            {uploadedFiles.length > 0 && (
              <button
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200 active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setCurrentChatingFile("Local Files"));
                  onFileClick?.();
                }}
                onTouchStart={(e) => e.stopPropagation()}
              >
                Chat All
              </button>
            )}
          </div>
          
          {uploadedFiles.length > 0 ? (
            <div className="space-y-1">
              {uploadedFiles.map((file: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                    "hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600",
                    "transition-all duration-200",
                    selectedFileId === file._id &&
                      "bg-blue-50 dark:bg-blue-900/50"
                  )}
                  onClick={() => handleLocalFileClick(file)}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleLocalFileClick(file);
                  }}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {file.filename}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {formatFileSize(file.fileSize)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No files uploaded
              </div>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                Upload files to get started
              </div>
            </div>
          )}
        </div>

        {/* Google Drive Files Section */}
        <div>
          <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900 mr-3">
                <HardDrive className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">
                Google Drive
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {driveFiles.length > 0 && (
                <>
                  <button
                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors duration-200 active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(setCurrentChatingFile("Gdrive"));
                      onFileClick?.();
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    Chat All
                  </button>
                  <button
                    className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors duration-200 flex items-center gap-1 active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoogleDriveLogout();
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                    disabled={driveLoading}
                    title="Disconnect Google Drive"
                  >
                    <LogOut className="w-3 h-3" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
          
          {driveFiles.length > 0 ? (
            <div className="space-y-1">
              {driveFiles.map((file: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                    "hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600",
                    "transition-all duration-200",
                    selectedFileId === file.id &&
                      "bg-green-50 dark:bg-green-900/50"
                  )}
                  onClick={() => handleDriveFileClick(file)}
                  onTouchStart={(e) => handleDriveFileTouch(file, e)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.fileSize)}
                    </span>
                    {file.synced ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : loadingFiles[file.id] ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : (
                      <Repeat
                        className="w-4 h-4 text-blue-500 hover:text-blue-700 cursor-pointer active:scale-110"
                        onClick={(e) => handleSyncFile(file.id, e)}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          handleSyncFile(file.id, e);
                        }}
                      />
                    )}
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {driveLoading ? "Connecting to Google Drive..." : "No files found in Google Drive"}
              </div>
              <button
                className="mt-2 px-4 py-2 text-xs text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2 mx-auto active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchDriveFiles();
                }}
                onTouchStart={(e) => e.stopPropagation()}
                disabled={driveLoading}
              >
                {driveLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <HardDrive className="w-4 h-4" />
                    Connect to Google Drive
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle - Works with both mouse and touch */}
      <div
        className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 transition-colors duration-200 touch-manipulation"
        onMouseDown={startDraggingMouse}
        onTouchStart={startDraggingTouch}
        style={{ 
          touchAction: 'none', // Prevent default touch actions like scrolling
          userSelect: 'none' // Prevent text selection while dragging
        }}
      >
        {/* Visual indicator for better touch target */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
};
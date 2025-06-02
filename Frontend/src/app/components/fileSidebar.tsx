import React, { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Image,
  FileSpreadsheet,
  RefreshCw,
  RotateCw,
  RefreshCcw,
  FolderSync,
  CloudDownload,
  Repeat,
  Loader2,
  FolderSyncIcon,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RootState } from "./reduxtoolkit/store";
import { useDispatch, useSelector } from "react-redux";
import { Chat } from "./chatdashboard";
import { setCurrentChatingFile, setFileId } from "./reduxtoolkit/socketSlice";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  setDriveFiles,
  setDriveLoading,
  setDriveError,
} from "./reduxtoolkit/driveSlice";
import { showToast } from "@/lib/toast";
import { CheckboxItem } from "@radix-ui/react-dropdown-menu";

interface FileData {
  _id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
}

interface FileSidebarProps {
  onFileSelect?: (file: FileData) => void;
  onFileClick?: () => void; // Add this line
}
export const FileSidebar = ({ onFileSelect, onFileClick }: FileSidebarProps) => {
  const dispatch = useDispatch();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const uploadedFiles = useSelector(
    (state: RootState) => state.socket.uploadedFiles
  );
  const userId = useSelector((state: RootState) => state.socket.userId);
  const driveFiles = useSelector((state: RootState) => state.drive.driveFiles);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const sidebarWidth = useRef(300);

  const handleSyncFile = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
  
    // Don't sync if already synced
    const file = driveFiles.find((f: any) => f.id === fileId);
    if (file && (file as any).synced) return;
  
    // Set loading state for this file
    setLoadingFiles((prev) => ({ ...prev, [fileId]: true }));
  
    try {
      const response = await fetch(
        `http://localhost:4000/gdrive/sync?fileId=${fileId}&userId=${userId}`,
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
    try {
      dispatch(setDriveLoading(true));

      // Fetch PDF files from Google Drive
      const response = await fetch(
        `http://localhost:4000/auth/google/drive/files?userId=${userId}`,
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
      toggleSection("google");
    } catch (error) {
      console.log({ error });
    } finally {
      dispatch(setDriveLoading(false));
    }
  };

  const initiateGoogleDriveAuth = () => {
    // Redirect to authenticate Google Drive
    window.location.href =
      "http://localhost:4000/auth/google/drive?redirect=true";
  };
  const startDragging = (event: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = event.clientX;
    document.addEventListener("mousemove", onDragging);
    document.addEventListener("mouseup", stopDragging);
  };

  const onDragging = (event: MouseEvent) => {
    if (!isDragging.current || !sidebarRef.current) return;
    const deltaX = event.clientX - startX.current;
    let newWidth = sidebarWidth.current + deltaX;
    newWidth = Math.max(200, Math.min(newWidth, 600));
    sidebarRef.current.style.width = `${newWidth}px`;
    currentX.current = newWidth;
  };

  const stopDragging = () => {
    isDragging.current = false;
    sidebarWidth.current = currentX.current;
    document.removeEventListener("mousemove", onDragging);
    document.removeEventListener("mouseup", stopDragging);
  };

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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

    // Modify the click handlers for both local and Google Drive files
    const handleLocalFileClick = (file: any) => {
      dispatch(setCurrentChatingFile(file.filename));
      dispatch(setFileId(file._id));
      onFileClick?.(); // Call the onFileClick callback
    };
  
    const handleDriveFileClick = (file: any) => {
      console.log("clicked");
      
      if(file.synced) {
        dispatch(setCurrentChatingFile(file.name));
        dispatch(setFileId(file._id));
        onFileClick?.(); // Call the onFileClick callback
      } else {
        showToast("error", "Sync File", "File is not in Sync");
      }
    };

  return (
    <div
      ref={sidebarRef}
      className="h-full bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-700 shadow-xl relative"
      style={{ width: `${sidebarWidth.current}px`, transition: "none" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 text-white">
        <h2 className="text-xl font-bold">Files</h2>
        <p className="text-sm opacity-75 mt-1">Manage your documents</p>
      </div>

      {/* Sections Container */}
      <div className="space-y-2 p-2 h-[calc(100%-112px)] overflow-y-auto">
        {/* Local Files Section */}
        <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
          <div
            className="p-4 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            onClick={() => toggleSection("local")}
          >
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 mr-3">
              {expandedSections["local"] ? (
                <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex items-center justify-between flex-1">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Local
              </span>
              <button
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setCurrentChatingFile("Local Files"));
                  onFileClick?.();
                }}
              >
                Chat With All
              </button>
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              expandedSections["local"] ? "max-h-[full]" : "max-h-0"
            )}
          >
            <div
              className={cn(
                "overflow-y-auto transition-all duration-200", // Enable native scrollbar
                expandedSections["local"] ? "max-h-[500px]" : "max-h-0" // Adjust height dynamically
              )}
            >
              {uploadedFiles.length > 0 ? (
                <div className="space-y-1 p-2">
                  {uploadedFiles.map((file: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                        "transition-all duration-200",
                        selectedFileId === file._id &&
                          "bg-blue-50 dark:bg-blue-900/50"
                      )}
                      onClick={() => {
                        dispatch(setCurrentChatingFile(file.filename));
                        dispatch(setFileId(file._id));
                        handleLocalFileClick(file)
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
                <div className="p-4 text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No files uploaded
                  </div>
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    Upload files to get started
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

         {/* Google Drive Files Section */}
         <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
          <div
            className="p-4 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            onClick={() => toggleSection("google")}
          >
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900 mr-3">
              {expandedSections["google"] ? (
                <ChevronDown className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="flex items-center justify-between flex-1">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Google Drive
              </span>
              <button
                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setCurrentChatingFile("Gdrive"));
                  onFileClick?.();
                }}
              >
                Chat With All
              </button>
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              expandedSections["google"] ? "max-h-[500px]" : "max-h-0"
            )}
          >
            <div
              className={cn(
                "overflow-y-auto transition-all duration-200",
                expandedSections["google"] ? "max-h-[500px]" : "max-h-0"
              )}
            >
              {driveFiles.length > 0 ? (
                <div className="space-y-1 p-2">
                  {driveFiles.map((file: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                        "transition-all duration-200",
                        selectedFileId === file.id &&
                          "bg-green-50 dark:bg-green-900/50"
                      )}
                      onClick={() => {
                        if(file.synced){

                          dispatch(setCurrentChatingFile(file.name));
                          dispatch(setFileId(file._id));
                          handleDriveFileClick(file)
                        }else{
                          showToast("error", "Sync File", "File is not in Sync");
                        }
                      }}
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
                            className="w-4 h-4 text-blue-500 hover:text-blue-700 cursor-pointer"
                            onClick={(e) => handleSyncFile(file.id, e)}
                          />
                        )}
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No files found in Google Drive
                  </div>
                  <button
                    className="mt-2 px-4 py-2 text-xs text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchDriveFiles();
                    }}
                  >
                    Connect to Google Drive
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors duration-200"
        onMouseDown={startDragging}
      />
    </div>
  );
};

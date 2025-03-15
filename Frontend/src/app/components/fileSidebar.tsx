import React, { useState, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RootState } from "./reduxtoolkit/store";
import { useDispatch, useSelector } from "react-redux";
import { Chat } from "./chatdashboard";
import { setCurrentChatingFile, setFileId } from "./reduxtoolkit/socketSlice";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileData {
  _id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
}

interface FileSidebarProps {
  onFileSelect?: (file: FileData) => void;
}

export const FileSidebar = ({ onFileSelect }: FileSidebarProps) => {
  const dispatch = useDispatch();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const uploadedFiles = useSelector(
    (state: RootState) => state.socket.uploadedFiles
  );

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const sidebarWidth = useRef(300);

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

  const handleFileClick = (file: FileData) => {
    setSelectedFileId(file._id);
    onFileSelect?.(file);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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
              <span className="font-semibold text-gray-700 dark:text-gray-200">Local Files</span>
              <button
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setCurrentChatingFile("Local Files"));
                }}
              >
                Chat
              </button>
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              expandedSections["local"] ? "max-h-[full]" : "max-h-0"
            )}
          >
            <ScrollArea className="h-[500px]">
            {uploadedFiles.length > 0 ? (
              <div className="space-y-1 p-2">
                {uploadedFiles.map((file: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                      "transition-all duration-200",
                      selectedFileId === file._id && "bg-blue-50 dark:bg-blue-900/50"
                    )}
                    onClick={() => {
                      dispatch(setCurrentChatingFile(file.filename));
                      dispatch(setFileId(file._id));
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
                <div className="text-sm text-gray-500 dark:text-gray-400">No files uploaded</div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">Upload files to get started</div>
              </div>
            )}
            </ScrollArea>
          </div>
        </div>

        {/* Google Drive Section */}
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
              <span className="font-semibold text-gray-700 dark:text-gray-200">Google Drive</span>
              <button
                className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setCurrentChatingFile("Google Drive"));
                }}
              >
                Chat
              </button>
            </div>
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              expandedSections["google"] ? "max-h-[500px]" : "max-h-0"
            )}
          >
            <div className="p-4 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Connect Google Drive</div>
              <button className="mt-2 px-4 py-2 text-xs text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-200">
                Connect
              </button>
            </div>
          </div>
        </div>

        {/* Box Files Section */}
        <div className="rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
          <div
            className="p-4 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            onClick={() => toggleSection("box")}
          >
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 mr-3">
              {expandedSections["box"] ? (
                <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div className="flex items-center justify-between flex-1">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Box</span>
              <button
                className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded-full hover:bg-purple-700 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setCurrentChatingFile("Box"));
                }}
              >
                Chat
              </button>
            </div>
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              expandedSections["box"] ? "max-h-[500px]" : "max-h-0"
            )}
          >
            <div className="p-4 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Connect Box Account</div>
              <button className="mt-2 px-4 py-2 text-xs text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors duration-200">
                Connect
              </button>
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
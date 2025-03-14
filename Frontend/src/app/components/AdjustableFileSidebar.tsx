import React, { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Image,
  FileSpreadsheet,
  GripHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RootState } from "./reduxtoolkit/store";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentChatingFile } from "./reduxtoolkit/socketSlice";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export const AdjustableFileSidebar = () => {
  const dispatch = useDispatch();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    local: true,
    drive: false,
    box: false,
  });
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const uploadedFiles = useSelector(
    (state: RootState) => state.socket.uploadedFiles
  );
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = () => {
    setIsResizing(true);
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

  return (
    <div
      ref={sidebarRef}
      className="relative h-full bg-white dark:bg-gray-900"
      style={{ width: sidebarWidth }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
        <h2 className="text-xl font-bold text-white">Files</h2>
        <p className="text-sm text-blue-100 mt-1">Manage your documents</p>
      </div>

      {/* Main Scrollable Container */}
      <ScrollArea className="h-[calc(100%-5rem)] overflow-auto">
        <div className="p-4 space-y-4">
          {/* Local Files */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 w-3/4">
            <div
              className="p-4 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleSection("local")}
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 mr-3">
                {expandedSections.local ? (
                  <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Local Files
              </span>
            </div>

            <ScrollArea
              className={cn(
                "transition-all duration-200",
                expandedSections.local ? "h-[500px]" : "h-0"
              )}
            >
              <div className="p-2">
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-1">
                    {uploadedFiles.map((file: any, index: number) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center p-3 rounded-lg cursor-pointer",
                          "hover:bg-gray-100 dark:hover:bg-gray-700",
                          "transition-colors",
                          selectedFileId === file._id &&
                            "bg-blue-50 dark:bg-blue-900/50"
                        )}
                        onClick={() => {
                          setSelectedFileId(file._id);
                          dispatch(setCurrentChatingFile(file.filename));
                        }}
                      >
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                          {getFileIcon(file.mimeType)}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                            {file.filename}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.fileSize)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No files uploaded
                  </div>
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Google Drive */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 w-3/4">
            <div
              className="p-4 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleSection("drive")}
            >
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900 mr-3">
                {expandedSections.drive ? (
                  <ChevronDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                )}
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Google Drive
              </span>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                expandedSections.drive ? "h-[100px]" : "h-0"
              )}
            >
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Connect your Google Drive
                </p>
                <button className="mt-3 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Connect
                </button>
              </div>
            </div>
          </div>

          {/* Box */}
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 w-3/4">
            <div
              className="p-4 flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleSection("box")}
            >
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 mr-3">
                {expandedSections.box ? (
                  <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Box
              </span>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                expandedSections.box ? "h-[100px]" : "h-0"
              )}
            >
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Connect your Box account
                </p>
                <button className="mt-3 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize group"
        onMouseDown={startResizing}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 -translate-x-1.5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 dark:bg-blue-900">
          <GripHorizontal className="w-3 h-3 text-blue-600 dark:text-blue-400 rotate-90" />
        </div>
      </div>
    </div>
  );
};

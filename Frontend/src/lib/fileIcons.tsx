import React, { memo, useMemo } from 'react';
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Film,
  Music,
  Archive,
  Code,
  FileQuestion,
} from 'lucide-react';

// Icon configuration with optimized lookup
const ICON_CONFIG = {
  // Images - Use Image icon for all image types
  'image/jpeg': { Icon: Image, color: 'text-green-600 dark:text-green-400' },
  'image/png': { Icon: Image, color: 'text-green-600 dark:text-green-400' },
  'image/gif': { Icon: Image, color: 'text-green-600 dark:text-green-400' },
  'image/webp': { Icon: Image, color: 'text-green-600 dark:text-green-400' },
  'image/svg+xml': { Icon: Image, color: 'text-green-600 dark:text-green-400' },
  'image/bmp': { Icon: Image, color: 'text-green-600 dark:text-green-400' },
  'image/tiff': { Icon: Image, color: 'text-green-600 dark:text-green-400' },
  'image/x-icon': { Icon: Image, color: 'text-green-600 dark:text-green-400' },
  
  // Documents - Use FileText for document files
  'application/pdf': { Icon: FileText, color: 'text-red-600 dark:text-red-400' },
  'application/msword': { Icon: FileText, color: 'text-blue-600 dark:text-blue-400' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { Icon: FileText, color: 'text-blue-600 dark:text-blue-400' },
  'application/vnd.ms-word.document.macroEnabled.12': { Icon: FileText, color: 'text-blue-600 dark:text-blue-400' },
  'application/rtf': { Icon: FileText, color: 'text-blue-600 dark:text-blue-400' },
  
  // Spreadsheets - Use FileSpreadsheet for spreadsheet files
  'application/vnd.ms-excel': { Icon: FileSpreadsheet, color: 'text-green-600 dark:text-green-400' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { Icon: FileSpreadsheet, color: 'text-green-600 dark:text-green-400' },
  'application/vnd.ms-excel.sheet.macroEnabled.12': { Icon: FileSpreadsheet, color: 'text-green-600 dark:text-green-400' },
  'text/csv': { Icon: FileSpreadsheet, color: 'text-green-600 dark:text-green-400' },
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12': { Icon: FileSpreadsheet, color: 'text-green-600 dark:text-green-400' },
  
  // Presentations - Use FileText for presentations (Lucide doesn't have specific presentation icon)
  'application/vnd.ms-powerpoint': { Icon: FileText, color: 'text-orange-600 dark:text-orange-400' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { Icon: FileText, color: 'text-orange-600 dark:text-orange-400' },
  'application/vnd.ms-powerpoint.presentation.macroEnabled.12': { Icon: FileText, color: 'text-orange-600 dark:text-orange-400' },
  
  // Archives - Use Archive for compressed files
  'application/zip': { Icon: Archive, color: 'text-purple-600 dark:text-purple-400' },
  'application/x-rar-compressed': { Icon: Archive, color: 'text-purple-600 dark:text-purple-400' },
  'application/x-7z-compressed': { Icon: Archive, color: 'text-purple-600 dark:text-purple-400' },
  'application/x-tar': { Icon: Archive, color: 'text-purple-600 dark:text-purple-400' },
  'application/gzip': { Icon: Archive, color: 'text-purple-600 dark:text-purple-400' },
  'application/x-compressed': { Icon: Archive, color: 'text-purple-600 dark:text-purple-400' },
  'application/x-zip-compressed': { Icon: Archive, color: 'text-purple-600 dark:text-purple-400' },
  
  // Audio - Use Music for audio files
  'audio/mpeg': { Icon: Music, color: 'text-pink-600 dark:text-pink-400' },
  'audio/wav': { Icon: Music, color: 'text-pink-600 dark:text-pink-400' },
  'audio/ogg': { Icon: Music, color: 'text-pink-600 dark:text-pink-400' },
  'audio/mp4': { Icon: Music, color: 'text-pink-600 dark:text-pink-400' },
  'audio/aac': { Icon: Music, color: 'text-pink-600 dark:text-pink-400' },
  'audio/flac': { Icon: Music, color: 'text-pink-600 dark:text-pink-400' },
  'audio/webm': { Icon: Music, color: 'text-pink-600 dark:text-pink-400' },
  'audio/midi': { Icon: Music, color: 'text-pink-600 dark:text-pink-400' },
  
  // Video - Use Film for video files
  'video/mp4': { Icon: Film, color: 'text-indigo-600 dark:text-indigo-400' },
  'video/quicktime': { Icon: Film, color: 'text-indigo-600 dark:text-indigo-400' },
  'video/x-msvideo': { Icon: Film, color: 'text-indigo-600 dark:text-indigo-400' },
  'video/webm': { Icon: Film, color: 'text-indigo-600 dark:text-indigo-400' },
  'video/mpeg': { Icon: Film, color: 'text-indigo-600 dark:text-indigo-400' },
  'video/x-matroska': { Icon: Film, color: 'text-indigo-600 dark:text-indigo-400' },
  'video/3gpp': { Icon: Film, color: 'text-indigo-600 dark:text-indigo-400' },
  
  // Code - Use Code for code files
  'text/javascript': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'application/json': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'text/html': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'text/css': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'text/xml': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'application/xml': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'text/x-python': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'text/x-java-source': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'text/x-c': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'text/x-c++': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  'application/x-sh': { Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
  
  // Text - Use File for plain text files
  'text/plain': { Icon: File, color: 'text-gray-600 dark:text-gray-400' },
  'text/markdown': { Icon: File, color: 'text-gray-600 dark:text-gray-400' },
  'text/rtf': { Icon: File, color: 'text-gray-600 dark:text-gray-400' },
  
  // Additional common formats
  'application/octet-stream': { Icon: FileQuestion, color: 'text-gray-600 dark:text-gray-400' },
  'application/download': { Icon: FileQuestion, color: 'text-gray-600 dark:text-gray-400' },
} as const;

// Create a Map for O(1) lookup performance
const iconMap = new Map(Object.entries(ICON_CONFIG));

// Fallback patterns for dynamic matching
const FALLBACK_PATTERNS = [
  { pattern: /^image\//, Icon: Image, color: 'text-green-600 dark:text-green-400' },
  { pattern: /^text\//, Icon: File, color: 'text-gray-600 dark:text-gray-400' },
  { pattern: /^audio\//, Icon: Music, color: 'text-pink-600 dark:text-pink-400' },
  { pattern: /^video\//, Icon: Film, color: 'text-indigo-600 dark:text-indigo-400' },
  { pattern: /pdf/, Icon: FileText, color: 'text-red-600 dark:text-red-400' },
  { pattern: /excel|spreadsheet/, Icon: FileSpreadsheet, color: 'text-green-600 dark:text-green-400' },
  { pattern: /word|document/, Icon: FileText, color: 'text-blue-600 dark:text-blue-400' },
  { pattern: /powerpoint|presentation/, Icon: FileText, color: 'text-orange-600 dark:text-orange-400' },
  { pattern: /zip|rar|tar|gzip|archive/, Icon: Archive, color: 'text-purple-600 dark:text-purple-400' },
  { pattern: /javascript|json|html|css|xml/, Icon: Code, color: 'text-yellow-600 dark:text-yellow-400' },
];

// Memoized icon component for performance
const FileIconComponent = memo(({ Icon, color, size = 'w-4 h-4' }: {
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  size?: string;
}) => {
  return <Icon className={`${size} ${color}`} />;
});

FileIconComponent.displayName = 'FileIconComponent';

// Main hook for getting file icons with caching
export const useFileIcon = (mimeType: string) => {
  return useMemo(() => {
    // Fast path: exact match
    const exactMatch = iconMap.get(mimeType);
    if (exactMatch) {
      return (
        <FileIconComponent 
          Icon={exactMatch.Icon} 
          color={exactMatch.color} 
        />
      );
    }

    // Fallback: pattern matching
    for (const { pattern, Icon, color } of FALLBACK_PATTERNS) {
      if (pattern.test(mimeType)) {
        return (
          <FileIconComponent 
            Icon={Icon} 
            color={color} 
          />
        );
      }
    }

    // Default fallback
    return (
      <FileIconComponent 
        Icon={FileQuestion} 
        color="text-gray-600 dark:text-gray-400" 
      />
    );
  }, [mimeType]);
};

// Utility function for direct usage (non-hook)
export const getFileIcon = (mimeType: string) => {
  // Fast path: exact match
  const exactMatch = iconMap.get(mimeType);
  if (exactMatch) {
    return (
      <FileIconComponent 
        Icon={exactMatch.Icon} 
        color={exactMatch.color} 
      />
    );
  }

  // Fallback: pattern matching
  for (const { pattern, Icon, color } of FALLBACK_PATTERNS) {
    if (pattern.test(mimeType)) {
      return (
        <FileIconComponent 
          Icon={Icon} 
          color={color} 
        />
      );
    }
  }

  // Default fallback
  return (
    <FileIconComponent 
      Icon={FileQuestion} 
      color="text-gray-600 dark:text-gray-400" 
    />
  );
};

// Export the component for direct usage
export default FileIconComponent;

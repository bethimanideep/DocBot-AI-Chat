import { showToast } from "./toast";



export interface FileData {
    id: string;
    name: string;
    type: 'document' | 'image' | 'spreadsheet';
    dateModified: string;
  }
  export const dummyFiles: FileData[] = [
    {
      id: '1',
      name: 'Project Proposal',
      type: 'document',
      dateModified: '2024-02-15'
    },
    {
      id: '2',
      name: 'Budget Overview',
      type: 'spreadsheet',
      dateModified: '2024-02-14'
    },
    {
      id: '3',
      name: 'Team Photo',
      type: 'image',
      dateModified: '2024-02-13'
    },
    {
      id: '4',
      name: 'Meeting Notes',
      type: 'document',
      dateModified: '2024-02-12'
    },
    {
      id: '5',
      name: 'Presentation Deck',
      type: 'document',
      dateModified: '2024-02-11'
    }
  ];

/**
 * Fetches user files from the backend /files endpoint
 * @returns Promise with files array or null if error
 */
export async function fetchUserFiles(): Promise<any[] | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/files`, {
      method: "GET",
      credentials: 'include', // Include cookies for authentication
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error("Error fetching files:", error);
    return null;
  }
}

/**
 * Fetches Google Drive files from the backend /auth/google/drive/files endpoint
 * @returns Promise with driveFiles array or null if error
 */
export async function fetchDriveFiles(): Promise<any[] | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/drive/files`, {
      method: "GET",
      credentials: 'include', // Include cookies for authentication
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`Failed to fetch Google Drive files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.driveFiles || [];
  } catch (error) {
    console.error("Error fetching Google Drive files:", error);
    return null;
  }
}
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the DriveFile interface with fileSize and mimeType
interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
  fileSize: number; // Size in bytes
  mimeType: string; // MIME type of the file
}

interface DriveState {
  driveFiles: DriveFile[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DriveState = {
  driveFiles: [],
  isLoading: false,
  error: null,
};

const driveSlice = createSlice({
  name: "drive",
  initialState,
  reducers: {
    // Action to set the list of Google Drive files
    setDriveFiles: (state, action: PayloadAction<DriveFile[]>) => {
      state.driveFiles = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    // Action to set the loading state
    setDriveLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // Action to set an error message
    setDriveError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

// Export the actions
export const { setDriveFiles, setDriveLoading, setDriveError } = driveSlice.actions;

// Export the reducer
export default driveSlice.reducer;
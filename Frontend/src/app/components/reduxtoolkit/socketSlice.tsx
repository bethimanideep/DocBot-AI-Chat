import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SocketState {
  socketId: string | null;
  username: string | null;
  userId: string | null;
  uploadedFiles: { filename: string }[];
  isLoading: boolean;
  progress: number;
  currentChatingFile: string | null; // New state for selected file
}

const initialState: SocketState = {
  socketId: null,
  username: null,
  userId: null,
  uploadedFiles: [],
  isLoading: false,
  progress: 0,
  currentChatingFile: null, // Default null
};

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setSocketId: (state, action: PayloadAction<string>) => {
      state.socketId = action.payload;
    },
    setUsername: (state, action: PayloadAction<string | null>) => {
      state.username = action.payload;
    },
    setUserId: (state, action: PayloadAction<string | null>) => {
      state.userId = action.payload;
    },
    setUploadedFiles: (state, action: PayloadAction<{ filename: string }[]>) => {
      state.uploadedFiles = action.payload;
      state.isLoading = false;
      state.progress = 100;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    setCurrentChatingFile: (state, action: PayloadAction<string | null>) => {
      state.currentChatingFile = action.payload;
    },
  },
});

export const { setSocketId, setUsername, setUploadedFiles, setIsLoading, setProgress, setUserId, setCurrentChatingFile } =
  socketSlice.actions;
export default socketSlice.reducer;

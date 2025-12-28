import { useDispatch, useSelector } from "react-redux";
import { setDriveFiles, setDriveLoading, setDriveError } from "./reduxtoolkit/driveSlice";
import { RootState } from "./reduxtoolkit/store";

const fetchDriveFiles = async () => {
  const dispatch = useDispatch();

  try {
    dispatch(setDriveLoading(true)); // Set loading state

    // Fetch files from the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/drive/files`, {
      credentials: "include", // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Google Drive files");
    }

  const data = await response.json();

  // Dispatch the fetched files to the Redux store
  dispatch(setDriveFiles(data.driveFiles));
  } catch (error) {
    console.error("Error fetching Google Drive files:", error);
    dispatch(setDriveError("Failed to fetch Google Drive files"));
  } finally {
    dispatch(setDriveLoading(false)); // Reset loading state
  }
};

// Access the driveFiles state in a component
const driveFiles = useSelector((state: RootState) => state.drive.driveFiles);
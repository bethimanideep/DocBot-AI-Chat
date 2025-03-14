import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // LocalStorage as the default storage
import { combineReducers } from "redux";
import socketReducer from "./socketSlice"; // Import your slice
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";

// Combine reducers (if you have multiple slices)
const rootReducer = combineReducers({
  socket: persistReducer(
    {
      key: "socket", // Key for persistence
      storage, // Where to store data
      whitelist: ["username","userId","uploadedFiles"], // Persist only these fields
    },
    socketReducer
  ),
});

// Configure store with persisted reducer
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER], // Required to prevent warnings
      },
    }),
});

// Persistor
export const persistor = persistStore(store);

// Types for Redux
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

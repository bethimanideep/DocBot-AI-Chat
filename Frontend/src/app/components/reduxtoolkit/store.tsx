import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import socketReducer from "./socketSlice";
import driveReducer from "./driveSlice"; // Import the drive slice
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";

// Combine reducers
const rootReducer = combineReducers({
  socket: persistReducer(
    {
      key: "socket", // Key for persistence
      storage, // Where to store data
      whitelist: ["username", "userId"], // Persist only these fields
    },
    socketReducer
  ),
  drive: driveReducer, // Include drive slice without persistence
});

// Configure store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Persistor
export const persistor = persistStore(store);

// Types for Redux
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
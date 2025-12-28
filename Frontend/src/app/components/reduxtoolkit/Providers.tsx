"use client"; // This file must be a Client Component

import { Provider } from "react-redux";
import { persistor, store } from "./store";
import { PersistGate } from "redux-persist/integration/react";
import { useEffect } from "react";
import io from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { setSocketId } from "./socketSlice";
import { RootState } from "./store";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create a single socket instance for the app and store in Redux + window
  const SocketBootstrap = () => {
    const dispatch = useDispatch();
    const socketInstance = useSelector((state: RootState) => state.socket.socketInstance as any);

    useEffect(() => {
      if (typeof window === "undefined") return;
      if (socketInstance || (window as any).__DOCBOT_SOCKET__) return; // already created

    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, { withCredentials: true });
    // store instance on window for components to reuse without putting it into Redux
    (window as any).__DOCBOT_SOCKET__ = socket;

      socket.on("connect", () => {
        dispatch(setSocketId((socket.id as unknown) as string));
        console.log("Providers created socket", socket.id);
      });

      return () => {
        try {
          // don't disconnect here: keep socket live for SPA navigation; optional cleanup on full unload
          // socket.disconnect();
        } catch (e) {}
      };
    }, [dispatch, socketInstance]);

    return null;
  };

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketBootstrap />
        {children}
      </PersistGate>
    </Provider>
  );
}

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import {
  UserStatus,
  type ServerToClientEvents,
  type ClientToServerEvents,
  type SendMessagePayload,
  type JoinChannelPayload,
} from "@capsloc/types";
import { useAuth } from "./AuthContext";
import { getAccessToken } from "../services/api";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>; // TS definition for Socket.io

export interface SocketContextType {
  socket: TypedSocket | null;
  isConnected: boolean;
  onlineUsers: Record<string, UserStatus>;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  startTyping: (channelId: string) => void;
  stopTyping: (channelId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined); // Default SocketContext initialized with undefined

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuth(); // Grab authentication status and sanitized user data
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserStatus>>(
    {}, // Initialize empty Record dictionary of online user list
  );

  useEffect(() => {
    // Only connect when user has a valid authenticated session
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    // Vite proxy automatically routes ws /socket.io to http://localhost:3000
    const socketInstance: TypedSocket = io({
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("user_presence", (payload) => { // Populate online users list based on status
      setOnlineUsers((prev) => ({
        ...prev,
        [payload.userId]: payload.status,
      }));
    });

    socketInstance.on("error", (err) => {
      console.error("[Socket Gateway Error]:", err);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  const joinChannel = useCallback(
    (channelId: string) => {
      if (socket && isConnected) {
        const payload: JoinChannelPayload = { channelId };
        socket.emit("join_channel", payload);
      }
    },
    [socket, isConnected],
  );

  const leaveChannel = useCallback(
    (channelId: string) => {
      if (socket && isConnected) {
        const payload: JoinChannelPayload = { channelId };
        socket.emit("leave_channel", payload);
      }
    },
    [socket, isConnected],
  );

  const sendMessage = useCallback(
    (payload: SendMessagePayload) => {
      if (socket && isConnected) {
        socket.emit("send_message", payload);
      }
    },
    [socket, isConnected],
  );

  const startTyping = useCallback(
    (channelId: string) => {
      if (socket && isConnected) {
        socket.emit("typing_start", { channelId });
      }
    },
    [socket, isConnected],
  );

  const stopTyping = useCallback(
    (channelId: string) => {
      if (socket && isConnected) {
        socket.emit("typing_stop", { channelId });
      }
    },
    [socket, isConnected],
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        joinChannel,
        leaveChannel,
        sendMessage,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

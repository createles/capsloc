import { createContext } from "react";
import { type Socket } from "socket.io-client";
import {
  UserStatus,
  type ServerToClientEvents,
  type ClientToServerEvents,
  type SendMessagePayload,
  type UserMentionedPayload,
} from "@capsloc/types";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>; // TS definition for Socket.io

export interface SocketContextType {
  socket: TypedSocket | null;
  isConnected: boolean;
  onlineUsers: Record<string, UserStatus>;
  unreadCounts: Record<string, number>;
  mentionCounts: Record<string, number>;
  activeMentionToast: UserMentionedPayload | null;
  setActiveChannelId: (channelId: string | null) => void;
  clearUnread: (channelId: string) => void;
  dismissMentionToast: () => void;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  startTyping: (channelId: string) => void;
  stopTyping: (channelId: string) => void;
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined); // Default SocketContext initialized with undefined

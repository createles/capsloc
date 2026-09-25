import React, { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { type TypedSocket } from "./SocketContext";
import {
  UserStatus,
  ChannelType,
  type UserMentionedPayload,
  type DmReceivedPayload,
  type NotificationToastPayload,
  type OnlineUsersPayload,
  type MessageDTO,
  type UnreadSummaryDTO,
  type JoinChannelPayload,
  type SendMessagePayload,
  type ChannelDTO,
} from "@capsloc/types";
import { api, getAccessToken } from "../services/api";
import { io } from "socket.io-client";
import { SocketContext } from "./SocketContext";

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth(); // Grab authentication status and sanitized user data
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserStatus>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [mentionCounts, setMentionCounts] = useState<Record<string, number>>({});
  const [activeNotificationToast, setActiveNotificationToast] =
    useState<NotificationToastPayload | null>(null);

  const activeChannelIdRef = useRef<string | null>(null);
  const userId = user?.id; // Extract userId

  useEffect(() => {
    // Only connect when user has a valid authenticated session
    if (!isAuthenticated || !userId) {
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    // Use VITE_API_URL if configured, otherwise connect to current window origin
    const socketUrl = (import.meta.env.VITE_API_URL as string | undefined) || undefined;
    const socketInstance: TypedSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      setSocket(socketInstance);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("user_presence", (payload) => {
      // Populate online users list based on status
      setOnlineUsers((prev) => ({
        ...prev,
        [payload.userId]: payload.status,
      }));
    });

    socketInstance.on("online_users", (payload: OnlineUsersPayload) => {
      const initialMap: Record<string, UserStatus> = {};
      for (const id of payload.userIds) {
        initialMap[id] = UserStatus.ONLINE;
      }
      setOnlineUsers((prev) => ({
        ...prev,
        ...initialMap,
      }));
    });

    socketInstance.on("new_message", (message: MessageDTO) => {
      // Don't mark own messages as unread
      if (message.senderId === userId) return;

      // Don't notify if user is currently focused on this channel
      if (activeChannelIdRef.current === message.channelId) return;

      setUnreadCounts((prev) => ({
        ...prev,
        [message.channelId]: (prev[message.channelId] || 0) + 1,
      }));
    });

    socketInstance.on("channel_created", (channel: ChannelDTO) => {
      // Automatically subscribe to the newly created room on the socket
      socketInstance.emit("join_channel", { channelId: channel.id });
    });

    socketInstance.on("user_mentioned", (payload: UserMentionedPayload) => {
      // Exclude self-mention
      if (payload.message.senderId === userId) return;

      if (activeChannelIdRef.current !== payload.channelId) {
        setMentionCounts((prev) => ({
          ...prev,
          [payload.channelId]: (prev[payload.channelId] || 0) + 1,
        }));
      }

      setActiveNotificationToast({
        type: "mention",
        message: payload.message,
        channelId: payload.channelId,
        channelName: payload.channelName,
        channelType: payload.channelType,
        senderName: payload.senderName,
      });
    });

    socketInstance.on("dm_received", (payload: DmReceivedPayload) => {
      // Exclude self-messages
      if (payload.message.senderId === userId) return;

      // Don't toast if user is currently looking at this DM
      if (activeChannelIdRef.current === payload.channelId) return;

      setActiveNotificationToast({
        type: "dm",
        message: payload.message,
        channelId: payload.channelId,
        channelType: payload.channelType || ChannelType.DIRECT_MESSAGE,
        senderName: payload.senderName,
      });
    });

    socketInstance.on("error", (err) => {
      console.error("[Socket Gateway Error]:", err);
    });

    // Hydrate unread and mention counters from server (database-persisted lastReadAt)
    api
      .get<UnreadSummaryDTO>("/channels/unread/summary")
      .then(({ data }) => {
        if (data.unreadCounts) setUnreadCounts(data.unreadCounts);
        if (data.mentionCounts) setMentionCounts(data.mentionCounts);
      })
      .catch((err) => {
        console.error("Failed to hydrate unread summary from server:", err);
      });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, userId]); // Use userId as dependency so that status updates don't trigger context rerun

  // Auto-dismiss notification toast after 7 seconds
  useEffect(() => {
    if (!activeNotificationToast) return;
    const timer = setTimeout(() => {
      setActiveNotificationToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeNotificationToast]);

  const dismissNotificationToast = useCallback(() => {
    setActiveNotificationToast(null);
  }, []);

  const clearUnread = useCallback((channelId: string) => {
    setUnreadCounts((prev) => {
      if (!prev[channelId]) return prev;
      const next = { ...prev };
      delete next[channelId];
      return next;
    });
    setMentionCounts((prev) => {
      if (!prev[channelId]) return prev;
      const next = { ...prev };
      delete next[channelId];
      return next;
    });

    // Persist lastReadAt timestamp to database via POST /channels/:id/read
    api.post(`/channels/${channelId}/read`).catch((err) => {
      console.error(`Failed to mark channel ${channelId} as read:`, err);
    });
  }, []);

  const setActiveChannelId = useCallback(
    (channelId: string | null) => {
      activeChannelIdRef.current = channelId;
      if (channelId) {
        clearUnread(channelId);
      }
    },
    [clearUnread],
  );

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
        unreadCounts,
        mentionCounts,
        activeNotificationToast,
        activeMentionToast: activeNotificationToast as any,
        setActiveChannelId,
        clearUnread,
        dismissNotificationToast,
        dismissMentionToast: dismissNotificationToast,
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

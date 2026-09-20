import React, { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import type { TypingIndicatorPayload } from "@capsloc/types";

export interface TypingIndicatorProps {
  channelId: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ channelId }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (payload: TypingIndicatorPayload) => {
      if (payload.channelId === channelId && payload.userId !== user?.id) {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.set(payload.userId, payload.displayName);
          return updated;
        });
      }
    };

    const handleUserStopTyping = (payload: { channelId: string; userId: string }) => {
      if (payload.channelId === channelId) {
        setTypingUsers((prev) => {
          const updated = new Map(prev);
          updated.delete(payload.userId);
          return updated;
        });
      }
    };

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
    };
  }, [socket, channelId, user?.id]);

  if (typingUsers.size === 0) {
    return <div className="h-5 shrink-0 px-4" />; // Fixed height avoids layout shift
  }

  const names = Array.from(typingUsers.values()).join(", ");

  return (
    <div className="flex h-5 shrink-0 animate-pulse items-center space-x-2 px-4 font-mono text-[11px] text-accent-gold">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
      <span>
        {names} {typingUsers.size === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
};

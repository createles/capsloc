import React, { useState, useEffect } from "react";
import { X, Users, Search, Loader2, MessageSquare } from "lucide-react";
import {
  UserStatus,
  type UserProfileDTO,
  type ChannelDTO,
} from "@capsloc/types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { LocRoleBadge } from "../ui/LocRoleBadge";

export interface DirectMessageModalProps {
  onClose: () => void;
  onDmSelected: (channel: ChannelDTO) => void;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  onClose,
  onDmSelected,
}) => {
  const { user: currentUser } = useAuth();
  const { onlineUsers } = useSocket();
  const [users, setUsers] = useState<UserProfileDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get<UserProfileDTO[]>("/users");
        // Exclude current user from directory
        setUsers(data.filter((u) => u.id !== currentUser?.id));
      } catch (err) {
        console.error("Failed to load users directory:", err);
        setError("Failed to load teammate directory.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser?.id]);

  const handleSelectTeammate = async (targetUser: UserProfileDTO) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // POST /channels/dm is idempotent on backend
      const { data } = await api.post<ChannelDTO>("/channels/dm", {
        recipientId: targetUser.id,
      });

      onDmSelected(data);
      onClose();
    } catch (err: any) {
      console.error("Failed to start DM:", err);
      setError(
        err.response?.data?.message || "Failed to start direct message.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border-subtle bg-surface-panel shadow-2xl overflow-hidden font-sans flex flex-col
  max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4 bg-surface-card/40 shrink-0">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-accent-gold" />
            <span className="font-semibold text-sm text-white">
              Direct Messages
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border-subtle/60 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a teammate by name or @username..."
              className="w-full rounded-md border border-border-subtle bg-surface-card pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500
  focus:border-accent-gold/50 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-400 text-[11px] shrink-0">
            {error}
          </div>
        )}

        {/* Teammates Directory List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 space-x-2 text-xs text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-accent-gold" />
              <span>Loading team directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500">
              No teammates found matching "{searchQuery}"
            </div>
          ) : (
            filteredUsers.map((teammate) => {
              const isOnline = onlineUsers[teammate.id] === UserStatus.ONLINE;
              const initials = teammate.displayName
                .substring(0, 2)
                .toUpperCase();

              return (
                <button
                  key={teammate.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSelectTeammate(teammate)}
                  className="w-full flex items-center space-x-3 rounded-lg p-2.5 text-left hover:bg-surface-hover/60 transition-colors
  cursor-pointer group disabled:opacity-50"
                >
                  {/* Avatar & Online Dot */}
                  <div className="relative shrink-0">
                    <div
                      className="h-9 w-9 rounded-lg bg-brand-navy flex items-center justify-center font-mono font-bold text-accent-gold
  text-xs border border-accent-gold/20"
                    >
                      {initials}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-surface-panel ${
                        isOnline ? "bg-emerald-400" : "bg-gray-600"
                      }`}
                    />
                  </div>

                  {/* Teammate Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-white group-hover:text-accent-gold transition-colors truncate">
                        {teammate.displayName}
                      </span>
                      <LocRoleBadge role={teammate.locRole} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-0.5">
                      <span className="font-mono text-gray-500 truncate mr-2">
                        @{teammate.username}
                      </span>
                      {teammate.customStatus && (
                        <span className="truncate italic text-gray-400 max-w-35">
                          {teammate.customStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <MessageSquare
                    className="h-4 w-4 text-gray-600 group-hover:text-accent-gold transition-colors shrink-0 opacity-0 group-
  hover:opacity-100"
                  />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

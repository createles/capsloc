import React, { useState, useEffect } from "react";
import { X, Users, Search, Loader2, MessageSquare } from "lucide-react";
import { UserStatus, type UserProfileDTO, type ChannelDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useTranslation } from "../../i18n";
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
  const { socket, onlineUsers } = useSocket();
  const { t } = useTranslation();
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

  useEffect(() => {
    if (!socket) return;
    const handleUserUpdated = (updatedUser: UserProfileDTO) => {
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)),
      );
    };

    socket.on("user_updated", handleUserUpdated);
    return () => {
      socket.off("user_updated", handleUserUpdated);
    };
  }, [socket]);

  const handleSelectTeammate = async (targetUser: UserProfileDTO) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<ChannelDTO>("/channels/dm", {
        recipientId: targetUser.id,
      });

      onDmSelected(data);
      onClose();
    } catch (err: any) {
      console.error("Failed to start DM:", err);
      setError(err.response?.data?.message || "Failed to start direct message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-panel font-sans shadow-2xl shadow-black/80 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-surface-card/50 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent-gold/40 bg-brand-navy shadow-inner">
              <Users className="h-4 w-4 text-accent-gold" />
            </div>
            <span className="text-sm font-semibold text-white">{t("dm.title")}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="shrink-0 border-b border-white/[0.08] p-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dm.searchPlaceholder")}
              className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-3 pl-9 text-xs text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="m-4 shrink-0 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Teammates Directory List */}
        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2 py-10 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-accent-gold" />
              <span>{t("dm.loading")}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              {t("dm.noMatches", { query: searchQuery })}
            </div>
          ) : (
            filteredUsers.map((teammate) => {
              const isOnline = onlineUsers[teammate.id] === UserStatus.ONLINE;
              const initials = teammate.displayName.substring(0, 2).toUpperCase();

              return (
                <button
                  key={teammate.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSelectTeammate(teammate)}
                  className="group flex w-full cursor-pointer items-center space-x-3 rounded-xl border border-transparent p-2.5 text-left transition-all hover:border-white/[0.08] hover:bg-surface-card/80 active:scale-[0.99] disabled:opacity-50"
                >
                  {/* Avatar & Online Dot */}
                  <div className="relative shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-gold/30 bg-brand-navy font-mono text-xs font-bold text-accent-gold shadow-inner">
                      {initials}
                    </div>
                    <span
                      className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-panel ${
                        isOnline ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-600"
                      }`}
                    />
                  </div>

                  {/* Teammate Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="truncate text-xs font-semibold text-white transition-colors group-hover:text-accent-gold">
                        {teammate.displayName}
                      </span>
                      <LocRoleBadge role={teammate.locRole} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                      <span className="mr-2 truncate font-mono text-slate-500">
                        @{teammate.username}
                      </span>
                      {teammate.customStatus ? (
                        <span className="max-w-60 truncate text-slate-400 italic">
                          "{teammate.customStatus}"
                        </span>
                      ) : (
                        <span className={isOnline ? "text-emerald-400" : "text-slate-500"}>
                          {isOnline ? t("sidebar.online") : t("sidebar.offline")}
                        </span>
                      )}
                    </div>
                  </div>

                  <MessageSquare className="h-4 w-4 shrink-0 text-slate-600 opacity-0 transition-all group-hover:text-accent-gold group-hover:opacity-100" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

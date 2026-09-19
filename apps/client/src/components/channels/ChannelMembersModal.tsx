import React, { useState, useEffect } from "react";
import { X, Search, Loader2, Users, UserPlus } from "lucide-react";
import { UserStatus, type ChannelDTO, type ChannelMemberDTO, type UserProfileDTO, LocRole } from "@capsloc/types";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { LocRoleBadge } from "../ui/LocRoleBadge";

export interface ChannelMembersModalProps {
  channel: ChannelDTO;
  onClose: () => void;
  onOpenInvite?: () => void;
}

export const ChannelMembersModal: React.FC<ChannelMembersModalProps> = ({
  channel,
  onClose,
  onOpenInvite,
}) => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [members, setMembers] = useState<ChannelMemberDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ChannelMemberDTO[]>(`/channels/${channel.id}/members`);
        if (isMounted) {
          setMembers(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load channel members");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, [channel.id]);

  useEffect(() => {
    if (!socket) return;
    const handleUserUpdated = (updatedUser: UserProfileDTO) => {
      setMembers((prevMembers) =>
        prevMembers.map((m) =>
          m.userId === updatedUser.id
            ? { ...m, user: { ...m.user, ...updatedUser } }
            : m
        )
      );
    };

    socket.on("user_updated", handleUserUpdated);
    return () => {
      socket.off("user_updated", handleUserUpdated);
    };
  }, [socket]);

  const filteredMembers = members.filter((m) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const u = m.user;
    if (!u) return false;
    return (
      u.displayName?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.locRole?.toLowerCase().includes(query) ||
      u.primaryLocale?.toLowerCase().includes(query) ||
      u.targetLocales?.some((loc) => loc.toLowerCase().includes(query))
    );
  });

  const isChannelAdmin =
    user?.locRole === LocRole.LOC_PM ||
    channel.createdById === user?.id ||
    channel.members?.some((m) => m.userId === user?.id && m.role?.toLowerCase() === "admin");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl border border-border-subtle bg-surface-panel p-6 shadow-2xl space-y-4 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-navy border border-accent-gold/40">
              <Users className="h-4 w-4 text-accent-gold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white">Channel Members</h2>
                <span className="rounded-full bg-surface-card border border-border-subtle px-2 py-0.5 text-[10px] font-mono text-accent-gold">
                  {members.length}
                </span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                #{channel.name || "channel"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenInvite && isChannelAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInvite();
                }}
                className="flex items-center space-x-1 rounded bg-brand-navy hover:bg-brand-navy-light text-accent-gold border border-accent-gold/30 px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer"
                title="Invite Teammate"
              >
                <UserPlus className="h-3 w-3" />
                <span>Invite</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name, role, or locale (e.g. en, ja, de)..."
            className="w-full rounded-md border border-border-subtle bg-surface-card pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold/50"
          />
        </div>

        {/* Members Directory */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-xs text-gray-500 space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent-gold" />
              <span>Loading channel members...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500">
              {searchQuery
                ? "No members match your query."
                : "No members enrolled in this channel."}
            </div>
          ) : (
            filteredMembers.map((member) => {
              const u = member.user;
              if (!u) return null;

              const isSelf = member.userId === user?.id;
              const isOnline = onlineUsers[member.userId] === UserStatus.ONLINE;
              const initials = (u.displayName || u.username).substring(0, 2).toUpperCase();
              const isAdmin = member.role === "admin";

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-surface-card/40 border border-border-subtle/50 hover:bg-surface-hover/60 transition-colors"
                >
                  {/* Left: Avatar with presence dot + User Info */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="h-8 w-8 rounded-lg bg-brand-navy border border-accent-gold/25 flex items-center justify-center font-mono text-[11px] font-bold text-accent-gold">
                        {initials}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-panel ${
                          isOnline ? "bg-emerald-400" : "bg-gray-600"
                        }`}
                        title={isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-gray-100 truncate">
                          {u.displayName}
                        </span>
                        <LocRoleBadge role={u.locRole} />
                        {isAdmin && (
                          <span className="font-mono font-bold text-[10px] text-accent-gold uppercase tracking-wider">
                            ADMIN
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
                        <span>@{u.username}</span>
                        {u.primaryLocale && (
                          <>
                            <span>•</span>
                            <span className="text-accent-gold font-semibold whitespace-nowrap">
                              {u.primaryLocale}
                            </span>
                          </>
                        )}
                        {u.customStatus && (
                          <>
                            <span>•</span>
                            <span className="italic text-gray-300 truncate max-w-xs">
                              "{u.customStatus}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status/YOU Badge */}
                  <div className="shrink-0 ml-3 flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        isSelf
                          ? "text-accent-gold bg-accent-gold/15 px-1.5 py-0.5 rounded"
                          : isOnline
                            ? "text-emerald-400"
                            : "text-gray-500"
                      }`}
                    >
                      {isSelf ? "YOU" : isOnline ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { X, Search, Loader2, Users, UserPlus } from "lucide-react";
import {
  UserStatus,
  type ChannelDTO,
  type ChannelMemberDTO,
  type UserProfileDTO,
  LocRole,
} from "@capsloc/types";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useTranslation } from "../../i18n";
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
  const { t } = useTranslation();
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
          m.userId === updatedUser.id ? { ...m, user: { ...m.user, ...updatedUser } } : m,
        ),
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
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md duration-150 select-none">
      <div className="animate-in zoom-in-95 relative w-full max-w-lg space-y-4 rounded-2xl border border-white/[0.08] bg-surface-panel p-6 font-sans shadow-2xl shadow-black/80 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent-gold/40 bg-brand-navy shadow-inner">
              <Users className="h-4 w-4 text-accent-gold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white">{t("members.title")}</h2>
                <span className="rounded-full border border-white/[0.08] bg-surface-card/80 px-2 py-0.5 font-mono text-[10px] text-accent-gold">
                  {members.length}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
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
                className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-accent-gold/40 bg-accent-gold/10 px-3 py-1.5 font-mono text-xs font-semibold text-accent-gold transition-all duration-150 hover:bg-accent-gold hover:text-surface-canvas active:scale-[0.98]"
                title="Invite Teammate"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{t("members.invite")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("members.searchPlaceholder")}
            className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-3 pl-9 text-xs text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
          />
        </div>

        {/* Members Directory */}
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2 py-10 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-accent-gold" />
              <span>{t("members.loading")}</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              {searchQuery ? t("members.noMatches") : t("members.noEnrolled")}
            </div>
          ) : (
            filteredMembers.map((member) => {
              const u = member.user;
              if (!u) return null;

              const isSelf = member.userId === user?.id;
              const isOnline = onlineUsers[member.userId] === UserStatus.ONLINE;
              const initials = (u.displayName || u.username).substring(0, 2).toUpperCase();
              const isAdmin = member.role === "admin" || channel.createdById === member.userId;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface-card/50 p-2.5 transition-all hover:border-white/[0.1] hover:bg-surface-card/80"
                >
                  {/* Left: Avatar with presence dot + User Info */}
                  <div className="flex min-w-0 items-center space-x-3">
                    <div className="relative shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-gold/30 bg-brand-navy font-mono text-[11px] font-bold text-accent-gold shadow-inner">
                        {initials}
                      </div>
                      <span
                        className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-panel ${
                          isOnline
                            ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                            : "bg-slate-600"
                        }`}
                        title={isOnline ? t("sidebar.online") : t("sidebar.offline")}
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="truncate text-xs font-semibold text-slate-100">
                          {u.displayName}
                        </span>
                        <LocRoleBadge role={u.locRole} />
                        {isAdmin && (
                          <span className="font-mono text-[10px] font-bold tracking-wider text-accent-gold uppercase">
                            {t("members.admin")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-400">
                        <span>@{u.username}</span>
                        {u.primaryLocale && (
                          <>
                            <span>•</span>
                            <span className="font-semibold whitespace-nowrap text-accent-gold">
                              {u.primaryLocale}
                            </span>
                          </>
                        )}
                        {u.customStatus && (
                          <>
                            <span>•</span>
                            <span className="max-w-xs truncate text-slate-300 italic">
                              "{u.customStatus}"
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status/YOU Badge */}
                  <div className="ml-3 flex shrink-0 items-center space-x-2">
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        isSelf
                          ? "rounded-md border border-accent-gold/30 bg-accent-gold/15 px-2 py-0.5 text-accent-gold"
                          : isOnline
                            ? "text-emerald-400"
                            : "text-slate-500"
                      }`}
                    >
                      {isSelf
                        ? t("members.you")
                        : isOnline
                          ? t("members.online")
                          : t("members.offline")}
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

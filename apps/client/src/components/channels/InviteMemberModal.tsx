import React, { useState, useEffect } from "react";
import { X, Search, Loader2, UserPlus, Check } from "lucide-react";
import type { UserProfileDTO, ChannelDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useTranslation } from "../../i18n";
import { LocRoleBadge } from "../ui/LocRoleBadge";
import { Skeleton } from "../ui/Skeleton";

export interface InviteMemberModalProps {
  channel: ChannelDTO;
  onClose: () => void;
  onMemberAdded: (updatedChannel: ChannelDTO) => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  channel,
  onClose,
  onMemberAdded,
}) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfileDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get<UserProfileDTO[]>("/users");
        const enrolledUserIds = new Set(channel.members?.map((m) => m.userId) || []);
        const availableUsers = data.filter((u) => !enrolledUserIds.has(u.id));
        setUsers(availableUsers);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load user directory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [channel.members]);

  const handleInvite = async (targetUser: UserProfileDTO) => {
    setInvitingId(targetUser.id);
    setError(null);
    try {
      const { data: newMember } = await api.post(`/channels/${channel.id}/members`, {
        userId: targetUser.id,
      });

      setInvitedIds((prev) => new Set(prev).add(targetUser.id));

      const updatedMembers = [...(channel.members || []), newMember];
      onMemberAdded({
        ...channel,
        members: updatedMembers,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to invite user");
    } finally {
      setInvitingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.locRole?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="modal-backdrop-animate fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md select-none">
      <div className="modal-card-animate relative w-full max-w-md space-y-4 rounded-2xl border border-white/[0.08] bg-surface-panel p-6 font-sans shadow-2xl shadow-black/80">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent-gold/40 bg-brand-navy shadow-inner">
              <UserPlus className="h-4 w-4 text-accent-gold" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              {t("invite.title", { channel: channel.name || "channel" })}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
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
            placeholder={t("invite.searchPlaceholder")}
            className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-3 pl-9 text-xs text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
          />
        </div>

        {/* User List */}
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="space-y-2 py-1 select-none">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-surface-card/40 p-2.5"
                >
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-2.5 w-16 rounded bg-surface-card/60" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              {searchQuery ? t("invite.noMatches") : t("invite.allEnrolled")}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isInvited = invitedIds.has(u.id);
              const isInviting = invitingId === u.id;
              const initials = u.displayName.substring(0, 2).toUpperCase();

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-surface-card/50 p-2.5 transition-all hover:border-white/[0.1] hover:bg-surface-card/80"
                >
                  <div className="flex min-w-0 items-center space-x-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-gold/30 bg-brand-navy font-mono text-[11px] font-bold text-accent-gold shadow-inner">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="truncate text-xs font-semibold text-slate-100">
                          {u.displayName}
                        </span>
                        <LocRoleBadge role={u.locRole} />
                      </div>
                      <span className="block truncate font-mono text-[10px] text-slate-400">
                        @{u.username} • {u.primaryLocale}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isInvited || isInviting}
                    onClick={() => handleInvite(u)}
                    className={`ml-2 flex shrink-0 cursor-pointer items-center space-x-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                      isInvited
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border border-accent-gold/40 bg-accent-gold/10 text-accent-gold hover:bg-accent-gold hover:text-surface-canvas disabled:opacity-50"
                    }`}
                  >
                    {isInviting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isInvited ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{t("invite.enrolled")}</span>
                      </>
                    ) : (
                      <span>{t("invite.inviteBtn")}</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

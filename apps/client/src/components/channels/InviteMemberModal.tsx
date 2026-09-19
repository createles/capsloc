import React, { useState, useEffect } from "react";
import { X, Search, Loader2, UserPlus, Check } from "lucide-react";
import type { UserProfileDTO, ChannelDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { LocRoleBadge } from "../ui/LocRoleBadge";

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
        // Exclude users who are already enrolled in this channel
        const enrolledUserIds = new Set(channel.members?.map((m) => m.userId) || []);
        const availableUsers = data.filter((u) => !enrolledUserIds.has(u.id)); // Returns users who are not members
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
      // Call POST /api/channels/:id/members
      const { data: newMember } = await api.post(`/channels/${channel.id}/members`, {
        userId: targetUser.id,
      });

      setInvitedIds((prev) => new Set(prev).add(targetUser.id));

      // Update parent channel state
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div
        className="relative w-full max-w-md rounded-xl border border-border-subtle bg-surface-panel p-6 shadow-2xl space-y-4
  font-sans"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4 text-accent-gold" />
            <h2 className="text-sm font-semibold text-white">Invite to #{channel.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
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
            placeholder="Search colleagues by name or role..."
            className="w-full rounded-md border border-border-subtle bg-surface-card pl-9 pr-3 py-2 text-xs text-white
  placeholder-gray-500 focus:outline-none focus:border-accent-gold/50"
          />
        </div>

        {/* User List */}
        <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-gray-500 space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-accent-gold" />
              <span>Scanning directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              {searchQuery
                ? "No colleagues match your search."
                : "All workspace colleagues are already enrolled."}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isInvited = invitedIds.has(u.id);
              const isInviting = invitingId === u.id;
              const initials = u.displayName.substring(0, 2).toUpperCase();

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-card/40 border border-border-subtle/50
  hover:bg-surface-hover/60 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className="h-7 w-7 rounded bg-brand-navy border border-accent-gold/20 flex items-center justify-center
  font-mono text-[10px] font-bold text-accent-gold shrink-0"
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-gray-200 truncate">
                          {u.displayName}
                        </span>
                        <LocRoleBadge role={u.locRole} />
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 truncate block">
                        @{u.username} • {u.primaryLocale}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isInvited || isInviting}
                    onClick={() => handleInvite(u)}
                    className={`shrink-0 ml-2 flex items-center space-x-1 rounded px-2.5 py-1 text-[11px] font-medium
  transition-colors cursor-pointer ${
    isInvited
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : "bg-brand-navy hover:bg-brand-navy-light text-accent-gold border border-accent-gold/30 disabled:opacity-50"
  }`}
                  >
                    {isInviting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isInvited ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Enrolled</span>
                      </>
                    ) : (
                      <span>Invite</span>
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

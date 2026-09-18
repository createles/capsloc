import React, { useEffect, useState, useRef } from "react";
import { Hash, Loader2, Smile, Check, X, Plus } from "lucide-react";
import { ChannelType, UserStatus, type ChannelDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { LocRoleBadge } from "../ui/LocRoleBadge";
import { UserProfileModal } from "../profile/UserProfileModal";
import { CreateChannelModal } from "../channels/CreateChannelModal";
import { DirectMessageModal } from "../channels/DirectMessageModal";
import { UserProfileHoverCard } from "../common/UserProfileHoverCard";

export interface ChannelSidebarProps {
  activeChannelId: string | null;
  onSelectChannel: (channel: ChannelDTO) => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  activeChannelId,
  onSelectChannel,
}) => {
  const { user, updateProfile } = useAuth(); // use AuthContext for access to user and accessToken, updateProfile to update user status
  const { onlineUsers, unreadCounts, mentionCounts, clearUnread } = useSocket(); // grab from SocketContext
  const [channels, setChannels] = useState<ChannelDTO[]>([]);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false); // Modal Visibility
  const [isDirectMessageModalOpen, setIsDirectMessageModalOpen] = useState(false); // ^^
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showQuickStatus, setShowQuickStatus] = useState(false); // Quick-status modal
  const [customStatusInput, setCustomStatusInput] = useState(""); // Custom status form input
  const [isWritingCustom, setIsWritingCustom] = useState(false);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref bridges for mount-only defaults:
  const onSelectChannelRef = useRef(onSelectChannel);
  const activeChannelIdRef = useRef(activeChannelId);
  const clearUnreadRef = useRef(clearUnread);

  // Synchronize refs during render:
  useEffect(() => {
    onSelectChannelRef.current = onSelectChannel;
    activeChannelIdRef.current = activeChannelId;
    clearUnreadRef.current = clearUnread;
  });

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const { data } = await api.get<ChannelDTO[]>("/channels");
        setChannels(data);

        // Default to first channel on initial mount if none selected:
        if (!activeChannelIdRef.current && data.length > 0) {
          const first = data[0]!;
          onSelectChannelRef.current(first);
          clearUnreadRef.current(first.id);
        }
      } catch (err) {
        console.error("Failed to load channels:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, []); // Safe empty dependency array: all dynamic values read through stable refs

  // Ensure active channel (e.g. newly created DM from chat hover) is loaded in sidebar
  useEffect(() => {
    if (activeChannelId && channels.length > 0 && !channels.some((c) => c.id === activeChannelId)) {
      api
        .get<ChannelDTO[]>("/channels")
        .then(({ data }) => setChannels(data))
        .catch(console.error);
    }
  }, [activeChannelId, channels]);

  const handleChannelClick = (channel: ChannelDTO) => {
    clearUnread(channel.id);
    if (activeChannelId === channel.id) return;
    onSelectChannel(channel);
  };

  const projectChannels = channels.filter(
    // segregate channel rooms from DM rooms
    (c) => c.type === ChannelType.PUBLIC_PROJECT || c.type === ChannelType.PRIVATE_LOCALE,
  );

  const directMessages = channels.filter(
    // returns DM rooms
    (c) => c.type === ChannelType.DIRECT_MESSAGE,
  );

  // Helper: for DMs, returns other participant's user object
  const getDmRecipient = (channel: ChannelDTO) => {
    return channel.members?.find((m) => m.userId !== user?.id)?.user;
  };

  /**
   * Handlers for Channel / Direct Message creation
   */
  const handleChannelCreated = (newChannel: ChannelDTO) => {
    setChannels((prev) => {
      if (prev.some((c) => c.id === newChannel.id)) return prev;
      return [...prev, newChannel];
    });
    onSelectChannel(newChannel);
  };

  const handleDmSelected = (dmChannel: ChannelDTO) => {
    setChannels((prev) => {
      if (prev.some((c) => c.id === dmChannel.id)) return prev;
      return [...prev, dmChannel];
    });
    onSelectChannel(dmChannel);
  };

  /**
   * Handlers for status update pop-up
   */

  const STATUS_PRESETS = [
    { emoji: "☕", text: "On Break" },
    { emoji: "🎮", text: "LQA Testing" },
    { emoji: "💬", text: "Focus Mode" },
    { emoji: "🍕", text: "Lunch Break" },
    { emoji: "⛔", text: "Away" },
    { emoji: "💼", text: "In a Meeting" },
  ];

  const handleMouseEnter = () => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    setShowQuickStatus(true);
  };

  const handleMouseLeave = () => {
    statusTimeoutRef.current = setTimeout(() => {
      setShowQuickStatus(false);
      setIsWritingCustom(false);
    }, 250);
  };

  const handleSelectPreset = async (presetText: string) => {
    try {
      await updateProfile({ customStatus: presetText });
      setShowQuickStatus(false);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleCustomStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStatusInput.trim()) return;
    try {
      await updateProfile({ customStatus: customStatusInput.trim() });
      setCustomStatusInput("");
      setIsWritingCustom(false);
      setShowQuickStatus(false);
    } catch (err) {
      console.error("Failed to update custom status:", err);
    }
  };

  const handleClearStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateProfile({ customStatus: null });
      setShowQuickStatus(false);
    } catch (err) {
      console.error("Failed to clear status:", err);
    }
  };

  return (
    <aside className="w-64 border-r border-border-subtle bg-surface-panel flex flex-col justify-between select-none">
      {/* Scrollable Channels Area */}
      <div className="p-3 space-y-5 overflow-y-auto flex-1">
        {/* Project Channels */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-2 select-none">
            {/* Left: Section Title + Count Badge */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-semibold tracking-wider">
                Project Channels
              </span>
              <span
                className="rounded-full bg-surface-card border border-border-subtle px-1.5 py-0.5 text-[9px] font-mono text-gray-400
  font-medium leading-none"
              >
                {projectChannels.length}
              </span>
            </div>

            {/* Right: Plus Action Button */}
            <button
              type="button"
              onClick={() => setIsCreateChannelModalOpen(true)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
              title="Create Channel"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center space-x-2 px-2 py-2 text-xs text-gray-500 font-mono">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading channels...</span>
            </div>
          ) : (
            <div className="space-y-0.5">
              {projectChannels.map((channel) => {
                const isActive = activeChannelId === channel.id;
                const unreadCount = !isActive ? unreadCounts[channel.id] || 0 : 0;
                const mentionCount = !isActive ? mentionCounts[channel.id] || 0 : 0;
                const hasUnread = unreadCount > 0 || mentionCount > 0;

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => handleChannelClick(channel)}
                    className={`w-full flex items-center space-x-2 rounded px-2.5 py-1.5 text-xs font-medium transition-colors text-left ${
                      isActive
                        ? "bg-brand-navy text-white shadow-sm border border-accent-gold/20"
                        : hasUnread
                          ? "text-white bg-surface-card/40 hover:bg-surface-hover hover:text-white"
                          : "text-gray-400 hover:bg-surface-hover hover:text-gray-200"
                    }`}
                  >
                    <Hash
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isActive
                          ? "text-accent-gold"
                          : mentionCount > 0
                            ? "text-accent-gold"
                            : hasUnread
                              ? "text-white"
                              : "text-gray-500"
                      }`}
                    />
                    <span className={`truncate ${hasUnread ? "font-bold text-white" : ""}`}>
                      {channel.name}
                    </span>

                    {mentionCount > 0 ? (
                      <span className="ml-auto rounded-full bg-accent-gold text-brand-navy font-mono font-bold text-[10px] px-1.5 py-0.2 shadow-sm shrink-0">
                        @{mentionCount}
                      </span>
                    ) : unreadCount > 0 ? (
                      <span className="ml-auto rounded-full bg-surface-card border border-border-subtle text-gray-200 font-mono text-[10px] px-1.5 py-0.2 shrink-0">
                        {unreadCount}
                      </span>
                    ) : channel.projectTag ? (
                      <span className="ml-auto text-[9px] font-mono text-gray-500 uppercase shrink-0">
                        {channel.projectTag}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-2 select-none">
            {/* Left: Section Title + Count Badge */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-semibold tracking-wider">
                Direct Messages
              </span>
              <span
                className="rounded-full bg-surface-card border border-border-subtle px-1.5 py-0.5 text-[9px] font-mono text-gray-400
  font-medium leading-none"
              >
                {directMessages.length}
              </span>
            </div>

            {/* Right: Plus Action Button */}
            <button
              type="button"
              onClick={() => setIsDirectMessageModalOpen(true)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
              title="Start Direct Message"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {directMessages.map((channel) => {
              const isActive = activeChannelId === channel.id;
              const unreadCount = !isActive ? unreadCounts[channel.id] || 0 : 0;
              const mentionCount = !isActive ? mentionCounts[channel.id] || 0 : 0;
              const hasUnread = unreadCount > 0 || mentionCount > 0;

              const recipient = getDmRecipient(channel);
              const recipientName = recipient?.displayName || channel.name || "Direct Message";
              const isOnline = recipient?.id
                ? onlineUsers[recipient.id] === UserStatus.ONLINE
                : false;
              const initials = (recipientName || "DM").substring(0, 2).toUpperCase();

              const cardUser = recipient || {
                id: channel.id,
                displayName: recipientName,
                username: recipientName.toLowerCase().replace(/\s+/g, ""),
                locRole: null,
                customStatus: null,
                primaryLocale: null,
                targetLocales: null,
                status: isOnline ? "online" : "offline",
              };

              return (
                <UserProfileHoverCard
                  key={channel.id}
                  user={cardUser}
                  isOnline={isOnline}
                  isSelf={false}
                  className="w-full block"
                  side="right"
                >
                  <button
                    type="button"
                    onClick={() => handleChannelClick(channel)}
                    className={`w-full flex items-center space-x-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-all text-left ${
                      isActive
                        ? "bg-brand-navy text-white shadow-sm border border-accent-gold/30"
                        : hasUnread
                          ? "text-white bg-surface-card/40 hover:bg-surface-hover hover:text-white"
                          : "text-gray-400 hover:bg-surface-hover hover:text-gray-200"
                    }`}
                  >
                    {/* Left: Avatar Initials + Status Dot */}
                    <div className="relative shrink-0">
                      <div
                        className={`h-7 w-7 rounded-md border flex items-center justify-center font-mono text-[10px] font-bold ${
                          isActive
                            ? "bg-brand-navy-light text-accent-gold border-accent-gold/40"
                            : mentionCount > 0
                              ? "bg-brand-navy text-accent-gold border-accent-gold/30"
                              : "bg-surface-card text-gray-300 border-border-subtle"
                        }`}
                      >
                        {initials}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface-panel ${
                          isOnline ? "bg-emerald-400" : "bg-gray-600"
                        }`}
                      />
                    </div>

                    {/* Right: Name + Status Subtitle */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span
                          className={`truncate font-medium text-xs ${hasUnread ? "font-bold text-white" : "text-gray-200"}`}
                        >
                          {recipientName}
                        </span>
                        {mentionCount > 0 ? (
                          <span className="ml-1.5 rounded-full bg-accent-gold text-brand-navy font-mono font-bold text-[9px] px-1.5 py-0.2 shrink-0">
                            @{mentionCount}
                          </span>
                        ) : unreadCount > 0 ? (
                          <span className="ml-1.5 rounded-full bg-surface-card border border-border-subtle text-gray-200 font-mono text-[9px] px-1.5 py-0.2 shrink-0">
                            {unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <div className="h-3.5 text-[10px] truncate leading-tight mt-0.5">
                        {recipient?.customStatus ? (
                          <span className="italic text-gray-400 truncate block">
                            {recipient.customStatus}
                          </span>
                        ) : (
                          <span
                            className={`font-mono text-[9px] ${
                              isOnline ? "text-emerald-400/90" : "text-gray-500"
                            }`}
                          >
                            {isOnline ? "Online" : "Offline"}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </UserProfileHoverCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* Authenticated User Status Footer */}
      {user && (
        <div
          className="relative p-2 border-t border-border-subtle bg-surface-card/40 select-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Quick Status Hover Popover */}
          {showQuickStatus && (
            <div
              className="absolute bottom-full mb-2 left-2 right-2 z-40 rounded-xl border border-border-subtle bg-surface-panel p-3
  shadow-2xl space-y-2.5 font-sans"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <Smile className="h-3.5 w-3.5 text-accent-gold" />
                  Quick Status
                </span>
                {user.customStatus && (
                  <button
                    type="button"
                    onClick={handleClearStatus}
                    className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_PRESETS.map((preset) => (
                  <button
                    key={preset.text}
                    type="button"
                    onClick={() => handleSelectPreset(`${preset.emoji} ${preset.text}`)}
                    className="flex items-center space-x-1.5 rounded-md border border-border-subtle bg-surface-card hover:bg-surface-hover hover:border-accent-gold/40 p-1.5 text-left text-[11px] text-gray-200 transition-all cursor-pointer"
                  >
                    <span>{preset.emoji}</span>
                    <span className="truncate">{preset.text}</span>
                  </button>
                ))}
              </div>

              {/* Write Your Own Input Form */}
              {isWritingCustom ? (
                <form
                  onSubmit={handleCustomStatusSubmit}
                  className="flex items-center space-x-1.5 pt-1"
                >
                  <input
                    type="text"
                    autoFocus
                    value={customStatusInput}
                    onChange={(e) => setCustomStatusInput(e.target.value)}
                    placeholder="Type your status..."
                    maxLength={100}
                    className="flex-1 rounded-md border border-border-subtle bg-surface-card px-2 py-1 text-[11px] text-white
  placeholder-gray-500 focus:outline-none focus:border-accent-gold/50"
                  />
                  <button
                    type="submit"
                    disabled={!customStatusInput.trim()}
                    className="p-1 rounded-md bg-brand-navy hover:bg-brand-navy-light text-accent-gold border border-accent-gold/30
  disabled:opacity-40 cursor-pointer"
                    title="Save Status"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWritingCustom(false)}
                    className="p-1 rounded-md text-gray-400 hover:text-white cursor-pointer"
                    title="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsWritingCustom(true)}
                  className="w-full text-center text-[11px] text-accent-gold hover:underline py-0.5 cursor-pointer block"
                >
                  + Write your own...
                </button>
              )}
            </div>
          )}

          {/* Profile Trigger Card */}
          <div
            onClick={() => setIsProfileModalOpen(true)}
            className="p-2 rounded-lg hover:bg-surface-hover/60 cursor-pointer transition-colors flex items-center space-x-2.5 group"
            title="Click to edit full profile"
          >
            {/* Avatar Initials */}
            <div
              className="h-8 w-8 rounded-lg bg-brand-navy flex items-center justify-center font-mono font-bold text-accent-gold text-xs
  border border-accent-gold/20 shrink-0"
            >
              {user.displayName.substring(0, 2).toUpperCase()}
            </div>

            {/* User Details (Locked Height) */}
            <div className="overflow-hidden flex-1 min-w-0">
              {/* Line 1: Name and Role Badge with breathing room */}
              <div className="flex items-center justify-between space-x-1.5 min-w-0">
                <span className="text-xs font-semibold text-white group-hover:text-accent-gold transition-colors truncate">
                  {user.displayName}
                </span>
                <LocRoleBadge role={user.locRole} />
              </div>

              {/* Line 2: Status / Username on Left, Locale Tag on Right */}
              <div className="h-4 flex items-center justify-between text-[11px] mt-0.5 overflow-hidden">
                <div className="truncate mr-1.5 min-w-0">
                  {user.customStatus ? (
                    <span className="truncate italic text-gray-300">{user.customStatus}</span>
                  ) : (
                    <span className="font-mono text-gray-500 truncate">@{user.username}</span>
                  )}
                </div>

                {/* Locale Tag pinned on the right */}
                <span className="text-[9px] font-mono text-gray-400 bg-surface-panel px-1.5 py-0.2 rounded border border-border-subtle shrink-0 whitespace-nowrap">
                  {user.primaryLocale}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Profile Modal */}
      {isProfileModalOpen && <UserProfileModal onClose={() => setIsProfileModalOpen(false)} />}

      {/* Channel Creation Modal */}
      {isCreateChannelModalOpen && (
        <CreateChannelModal
          onClose={() => setIsCreateChannelModalOpen(false)}
          onChannelCreated={handleChannelCreated}
        />
      )}

      {/* Direct Message Teammate Selector Modal */}
      {isDirectMessageModalOpen && (
        <DirectMessageModal
          onClose={() => setIsDirectMessageModalOpen(false)}
          onDmSelected={handleDmSelected}
        />
      )}
    </aside>
  );
};

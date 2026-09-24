import React, { useEffect, useState, useRef } from "react";
import { Hash, Smile, Check, X, Plus, Search, ChevronDown } from "lucide-react";
import { ChannelType, UserStatus, type ChannelDTO, type UserProfileDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useTranslation } from "../../i18n";
import { LocRoleBadge } from "../ui/LocRoleBadge";
import { Skeleton } from "../ui/Skeleton";
import { UserProfileModal } from "../profile/UserProfileModal";
import { CreateChannelModal } from "../channels/CreateChannelModal";
import { DirectMessageModal } from "../channels/DirectMessageModal";
import { UserProfileHoverCard } from "../common/UserProfileHoverCard";

export interface ChannelSidebarProps {
  activeChannelId: string | null;
  onSelectChannel: (channel: ChannelDTO) => void;
}

const STATUS_PRESETS = [
  { emoji: "☕", key: "status.onBreak" },
  { emoji: "🎮", key: "status.lqaTesting" },
  { emoji: "💬", key: "status.focusMode" },
  { emoji: "🍕", key: "status.lunchBreak" },
  { emoji: "⛔", key: "status.away" },
  { emoji: "💼", key: "status.inMeeting" },
] as const;

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  activeChannelId,
  onSelectChannel,
}) => {
  const { user, updateProfile } = useAuth();
  const { socket, onlineUsers, unreadCounts, mentionCounts, clearUnread } = useSocket();
  const { t } = useTranslation();
  const [channels, setChannels] = useState<ChannelDTO[]>([]);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isDirectMessageModalOpen, setIsDirectMessageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showQuickStatus, setShowQuickStatus] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState("");
  const [isWritingCustom, setIsWritingCustom] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isDmsOpen, setIsDmsOpen] = useState(true);
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
  }, []);

  // Ensure active channel (e.g. newly created DM from chat hover) is loaded in sidebar
  useEffect(() => {
    if (activeChannelId && channels.length > 0 && !channels.some((c) => c.id === activeChannelId)) {
      api
        .get<ChannelDTO[]>("/channels")
        .then(({ data }) => setChannels(data))
        .catch(console.error);
    }
  }, [activeChannelId, channels]);

  useEffect(() => {
    if (!socket) return;
    const handleUserUpdated = (updatedUser: UserProfileDTO) => {
      setChannels((prevChannels) =>
        prevChannels.map((channel) => {
          if (!channel.members) return channel;
          const hasUser = channel.members.some((m) => m.userId === updatedUser.id);
          if (!hasUser) return channel;
          return {
            ...channel,
            members: channel.members.map((m) =>
              m.userId === updatedUser.id ? { ...m, user: { ...m.user, ...updatedUser } } : m,
            ),
          };
        }),
      );
    };

    const handleChannelUpdated = (updatedChannel: ChannelDTO) => {
      setChannels((prevChannels) =>
        prevChannels.map((c) => (c.id === updatedChannel.id ? { ...c, ...updatedChannel } : c)),
      );
    };

    const handleChannelCreated = (newChannel: ChannelDTO) => {
      setChannels((prev) => {
        if (prev.some((c) => c.id === newChannel.id)) return prev;
        return [...prev, newChannel];
      });
    };

    socket.on("user_updated", handleUserUpdated);
    socket.on("channel_updated", handleChannelUpdated);
    socket.on("channel_created", handleChannelCreated);
    return () => {
      socket.off("user_updated", handleUserUpdated);
      socket.off("channel_updated", handleChannelUpdated);
      socket.off("channel_created", handleChannelCreated);
    };
  }, [socket]);

  const handleChannelClick = (channel: ChannelDTO) => {
    clearUnread(channel.id);
    if (activeChannelId === channel.id) return;
    onSelectChannel(channel);
  };

  const projectChannels = channels.filter(
    (c) => c.type === ChannelType.PUBLIC_PROJECT || c.type === ChannelType.PRIVATE_LOCALE,
  );

  const directMessages = channels.filter((c) => c.type === ChannelType.DIRECT_MESSAGE);

  const getDmRecipient = (channel: ChannelDTO) => {
    return channel.members?.find((m) => m.userId !== user?.id)?.user;
  };

  const normalizedQuery = searchQuery.toLowerCase().trim();

  const filteredProjects = projectChannels.filter((c) => {
    if (!normalizedQuery) return true;
    return (
      c.name?.toLowerCase().includes(normalizedQuery) ||
      c.localeTag?.toLowerCase().includes(normalizedQuery) ||
      c.description?.toLowerCase().includes(normalizedQuery)
    );
  });

  const filteredDms = directMessages.filter((channel) => {
    if (!normalizedQuery) return true;
    const otherUser = getDmRecipient(channel);
    return (
      otherUser?.displayName?.toLowerCase().includes(normalizedQuery) ||
      otherUser?.username?.toLowerCase().includes(normalizedQuery) ||
      channel.name?.toLowerCase().includes(normalizedQuery)
    );
  });

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
    <aside className="flex w-64 flex-col justify-between border-r border-border-subtle bg-surface-panel select-none">
      {/* Quick Filter Search Input */}
      <div className="border-b border-border-subtle/50 px-3 pt-3 pb-2.5">
        <div className="relative">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("sidebar.filterPlaceholder")}
            className="w-full rounded-lg border border-border-subtle bg-surface-canvas/60 py-1.5 pr-7 pl-8 font-sans text-xs text-slate-200 placeholder-slate-500 transition-all focus:border-accent-gold/50 focus:bg-surface-card focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute top-2 right-2 cursor-pointer p-0.5 text-slate-500 hover:text-slate-200"
              title="Clear filter"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Channels Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {/* Project Channels */}
        <div>
          <div className="mb-1.5 flex items-center justify-between px-2 select-none">
            {/* Left: Collapsible Section Accordion Trigger */}
            <button
              type="button"
              onClick={() => setIsProjectsOpen((prev) => !prev)}
              className="flex cursor-pointer items-center space-x-1.5 text-slate-400 transition-colors hover:text-slate-200"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-150 ${
                  isProjectsOpen ? "rotate-0 text-slate-400" : "-rotate-90 text-slate-500"
                }`}
              />
              <span className="font-mono text-[10px] font-semibold tracking-wider uppercase">
                {t("sidebar.projectChannels")}
              </span>
              <span className="rounded-full border border-border-subtle bg-surface-card px-1.5 py-0.5 font-mono text-[9px] leading-none font-medium text-slate-400">
                {filteredProjects.length}
              </span>
            </button>

            {/* Right: Plus Action Button */}
            <button
              type="button"
              onClick={() => setIsCreateChannelModalOpen(true)}
              className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-surface-hover hover:text-white"
              title={t("sidebar.createChannel")}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {isProjectsOpen &&
            (isLoading ? (
              <div className="space-y-1 py-1">
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded bg-surface-card/60" />
                  <Skeleton className="h-3.5 w-36 rounded bg-surface-card/80" />
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded bg-surface-card/60" />
                  <Skeleton className="h-3.5 w-28 rounded bg-surface-card/60" />
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded bg-surface-card/60" />
                  <Skeleton className="h-3.5 w-32 rounded bg-surface-card/40" />
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded bg-surface-card/60" />
                  <Skeleton className="h-3.5 w-24 rounded bg-surface-card/40" />
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="px-2 py-2 font-sans text-xs text-slate-500 italic">
                {searchQuery ? t("sidebar.noChannelsMatch") : t("sidebar.noProjectChannels")}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredProjects.map((channel) => {
                  const isActive = activeChannelId === channel.id;
                  const unreadCount = !isActive ? unreadCounts[channel.id] || 0 : 0;
                  const mentionCount = !isActive ? mentionCounts[channel.id] || 0 : 0;
                  const hasUnread = unreadCount > 0 || mentionCount > 0;

                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => handleChannelClick(channel)}
                      className={`group relative flex w-full cursor-pointer items-center space-x-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors duration-150 ${
                        isActive
                          ? "border-accent-gold/30 bg-brand-navy/90 text-white shadow-xs"
                          : hasUnread
                            ? "border-transparent bg-surface-card/40 text-white hover:bg-surface-hover hover:text-white"
                            : "border-transparent text-slate-400 hover:bg-surface-hover/70 hover:text-slate-200"
                      }`}
                    >
                      <Hash
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          isActive
                            ? "text-accent-gold"
                            : mentionCount > 0
                              ? "text-accent-gold"
                              : hasUnread
                                ? "text-white"
                                : "text-slate-500 group-hover:text-slate-400"
                        }`}
                      />
                      <span className={`truncate ${hasUnread ? "font-bold text-white" : ""}`}>
                        {channel.name}
                      </span>

                      {mentionCount > 0 ? (
                        <span className="ml-auto shrink-0 rounded-full bg-accent-gold px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-navy shadow-xs">
                          @{mentionCount}
                        </span>
                      ) : unreadCount > 0 ? (
                        <span className="ml-auto shrink-0 rounded-full border border-border-subtle bg-surface-card px-1.5 py-0.5 font-mono text-[10px] text-slate-200">
                          {unreadCount}
                        </span>
                      ) : channel.projectTag ? (
                        <span className="ml-auto shrink-0 font-mono text-[9px] text-slate-500 uppercase">
                          {channel.projectTag}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
        </div>

        {/* Direct Messages */}
        <div>
          <div className="mb-1.5 flex items-center justify-between px-2 select-none">
            {/* Left: Collapsible Section Accordion Trigger */}
            <button
              type="button"
              onClick={() => setIsDmsOpen((prev) => !prev)}
              className="flex cursor-pointer items-center space-x-1.5 text-slate-400 transition-colors hover:text-slate-200"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-150 ${
                  isDmsOpen ? "rotate-0 text-slate-400" : "-rotate-90 text-slate-500"
                }`}
              />
              <span className="font-mono text-[10px] font-semibold tracking-wider uppercase">
                {t("sidebar.directMessages")}
              </span>
              <span className="rounded-full border border-border-subtle bg-surface-card px-1.5 py-0.5 font-mono text-[9px] leading-none font-medium text-slate-400">
                {filteredDms.length}
              </span>
            </button>

            {/* Right: Plus Action Button */}
            <button
              type="button"
              onClick={() => setIsDirectMessageModalOpen(true)}
              className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-surface-hover hover:text-white"
              title={t("sidebar.startDm")}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {isDmsOpen &&
            (isLoading ? (
              <div className="space-y-1 py-1">
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Skeleton className="h-4 w-4 rounded-full bg-surface-card/60" />
                  <Skeleton className="h-3.5 w-28 rounded bg-surface-card/80" />
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Skeleton className="h-4 w-4 rounded-full bg-surface-card/60" />
                  <Skeleton className="h-3.5 w-24 rounded bg-surface-card/60" />
                </div>
                <div className="flex items-center space-x-2 px-2 py-1.5">
                  <Skeleton className="h-4 w-4 rounded-full bg-surface-card/60" />
                  <Skeleton className="h-3.5 w-30 rounded bg-surface-card/40" />
                </div>
              </div>
            ) : filteredDms.length === 0 ? (
              <div className="px-2 py-2 font-sans text-xs text-slate-500 italic">
                {searchQuery ? t("sidebar.noDmsMatch") : t("sidebar.noDms")}
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredDms.map((channel) => {
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
                      className="block w-full"
                      side="right"
                    >
                      <button
                        type="button"
                        onClick={() => handleChannelClick(channel)}
                        className={`flex w-full cursor-pointer items-center space-x-2.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors duration-150 ${
                          isActive
                            ? "border-accent-gold/30 bg-brand-navy/90 text-white shadow-xs"
                            : hasUnread
                              ? "border-transparent bg-surface-card/40 text-white hover:bg-surface-hover hover:text-white"
                              : "border-transparent text-slate-400 hover:bg-surface-hover/70 hover:text-slate-200"
                        }`}
                      >
                        {/* Left: Avatar Initials + Status Dot */}
                        <div className="relative shrink-0">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-md border font-mono text-[10px] font-bold ${
                              isActive
                                ? "border-accent-gold/40 bg-brand-navy-light text-accent-gold"
                                : mentionCount > 0
                                  ? "border-accent-gold/30 bg-brand-navy text-accent-gold"
                                  : "border-border-subtle bg-surface-card text-slate-300"
                            }`}
                          >
                            {initials}
                          </div>
                          <span
                            className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-surface-panel ${
                              isOnline ? "bg-emerald-400" : "bg-slate-600"
                            }`}
                          />
                        </div>

                        {/* Right: Name + Status Subtitle */}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span
                              className={`truncate text-xs font-medium ${
                                hasUnread ? "font-bold text-white" : "text-slate-200"
                              }`}
                            >
                              {recipientName}
                            </span>
                            {mentionCount > 0 ? (
                              <span className="py-0.2 ml-1.5 shrink-0 rounded-full bg-accent-gold px-1.5 font-mono text-[9px] font-bold text-brand-navy">
                                @{mentionCount}
                              </span>
                            ) : unreadCount > 0 ? (
                              <span className="py-0.2 ml-1.5 shrink-0 rounded-full border border-border-subtle bg-surface-card px-1.5 font-mono text-[9px] text-slate-200">
                                {unreadCount}
                              </span>
                            ) : null}
                          </div>

                          {/* 2nd line: custom status subtitle or presence status */}
                          <div className="mt-0.5 truncate text-[10px]">
                            {recipient?.customStatus ? (
                              <span className="truncate text-slate-400 italic">
                                {recipient.customStatus}
                              </span>
                            ) : (
                              <span className={isOnline ? "text-emerald-400" : "text-slate-500"}>
                                {isOnline ? t("sidebar.online") : t("sidebar.offline")}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </UserProfileHoverCard>
                  );
                })}
              </div>
            ))}
        </div>
      </div>

      {/* Authenticated User Status Footer */}
      {user && (
        <div
          className="relative border-t border-border-subtle bg-surface-card/40 p-2.5 backdrop-blur-xs select-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Quick Status Hover Popover */}
          {showQuickStatus && (
            <div
              className="absolute right-2 bottom-full left-2 z-40 mb-2 space-y-2.5 rounded-xl border border-border-subtle bg-surface-panel p-3 font-sans shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                  <Smile className="h-3.5 w-3.5 text-accent-gold" />
                  {t("sidebar.quickStatus")}
                </span>
                {user.customStatus && (
                  <button
                    type="button"
                    onClick={handleClearStatus}
                    className="cursor-pointer text-[10px] text-gray-500 transition-colors hover:text-rose-400"
                  >
                    {t("sidebar.clear")}
                  </button>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleSelectPreset(`${preset.emoji} ${t(preset.key)}`)}
                    className="flex cursor-pointer items-center space-x-1.5 rounded-md border border-border-subtle bg-surface-card p-1.5 text-left text-[11px] text-gray-200 transition-all hover:border-accent-gold/40 hover:bg-surface-hover"
                  >
                    <span>{preset.emoji}</span>
                    <span className="truncate">{t(preset.key)}</span>
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
                    placeholder={t("sidebar.typeStatus")}
                    maxLength={100}
                    className="flex-1 rounded-md border border-border-subtle bg-surface-card px-2 py-1 text-[11px] text-white placeholder-gray-500 focus:border-accent-gold/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!customStatusInput.trim()}
                    className="cursor-pointer rounded-md border border-accent-gold/30 bg-brand-navy p-1 text-accent-gold hover:bg-brand-navy-light disabled:opacity-40"
                    title="Save Status"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWritingCustom(false)}
                    className="cursor-pointer rounded-md p-1 text-gray-400 hover:text-white"
                    title="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsWritingCustom(true)}
                  className="block w-full cursor-pointer py-0.5 text-center text-[11px] text-accent-gold hover:underline"
                >
                  {t("sidebar.writeCustom")}
                </button>
              )}
            </div>
          )}

          {/* Profile Trigger Card */}
          <div
            onClick={() => setIsProfileModalOpen(true)}
            className="group flex cursor-pointer items-center space-x-2.5 rounded-lg p-2 transition-colors hover:bg-surface-hover/60"
            title={t("sidebar.editFullProfile")}
          >
            {/* Avatar Initials */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-gold/20 bg-brand-navy font-mono text-xs font-bold text-accent-gold">
              {user.displayName.substring(0, 2).toUpperCase()}
            </div>

            {/* User Details (Locked Height) */}
            <div className="min-w-0 flex-1 overflow-hidden">
              {/* Line 1: Name and Role Badge with breathing room */}
              <div className="flex min-w-0 items-center justify-between space-x-1.5">
                <span className="truncate text-xs font-semibold text-white transition-colors group-hover:text-accent-gold">
                  {user.displayName}
                </span>
                <LocRoleBadge role={user.locRole} />
              </div>

              {/* Line 2: Status / Username on Left, Locale Tag on Right */}
              <div className="mt-0.5 flex h-4 items-center justify-between overflow-hidden text-[11px]">
                <div className="mr-1.5 min-w-0 truncate">
                  {user.customStatus ? (
                    <span className="truncate text-gray-300 italic">{user.customStatus}</span>
                  ) : (
                    <span className="truncate font-mono text-gray-500">@{user.username}</span>
                  )}
                </div>

                {/* Locale Tag pinned on the right */}
                <span className="py-0.2 shrink-0 rounded border border-border-subtle bg-surface-panel px-1.5 font-mono text-[9px] whitespace-nowrap text-gray-400">
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

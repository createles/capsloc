import React, { useState, useEffect } from "react";
import { Terminal, BookOpen, UserPlus, Users, Pin, Pencil, X, Info, Search } from "lucide-react";
import {
  type ChannelDTO,
  ChannelType,
  UserStatus,
  type UserProfileDTO,
  LocRole,
} from "@capsloc/types";
import { useTranslation } from "../../i18n";
import { MessageList } from "../chat/MessageList";
import { TypingIndicator } from "../chat/TypingIndicator";
import { MessageInput } from "../chat/MessageInput";
import { LocRoleBadge } from "../ui/LocRoleBadge";

export interface ChatPaneProps {
  activeChannel: ChannelDTO | null;
  currentUser: UserProfileDTO | null;
  onlineUsers: Record<string, UserStatus>;
  // Inspector & Tag Highlight
  isInspectorOpen: boolean;
  selectedStringKey: string | null;
  highlightedTagKey: string | null;
  onToggleInspector: () => void;
  onSelectStringKey: (key: string) => void;
  onDismissTagHighlight: () => void;
  onReportMatchesCount: (count: number) => void;
  // Modal Actions
  onOpenDm?: (targetUserId: string) => void;
  onOpenMembers: () => void;
  onOpenInvite: () => void;
  onOpenEditStatus: () => void;
  onOpenChannelDetails: () => void;
  // Pinned Banner
  isBannerVisible: boolean;
  onDismissBanner: (channelId: string) => void;
  onRestoreBanner: (channelId: string) => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  activeChannel,
  currentUser,
  onlineUsers,
  isInspectorOpen,
  selectedStringKey,
  highlightedTagKey,
  onToggleInspector,
  onSelectStringKey,
  onDismissTagHighlight,
  onReportMatchesCount,
  onOpenDm,
  onOpenMembers,
  onOpenInvite,
  onOpenEditStatus,
  onOpenChannelDetails,
  isBannerVisible,
  onDismissBanner,
  onRestoreBanner,
}) => {
  const { t } = useTranslation();
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    senderName: string;
    content: string;
  } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [prevChannelId, setPrevChannelId] = useState(activeChannel?.id);
  if (activeChannel?.id !== prevChannelId) {
    setPrevChannelId(activeChannel?.id);
    setReplyingTo(null);
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  // Global Ctrl+F / Cmd+F shortcut to open in-chat search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Derived Direct Message & Admin Resolution
  const isDm = activeChannel?.type === ChannelType.DIRECT_MESSAGE;
  const dmRecipient = isDm
    ? activeChannel?.members?.find((m) => m.userId !== currentUser?.id)?.user
    : null;
  const dmRecipientName = dmRecipient?.displayName || activeChannel?.name || "Direct Message";
  const dmRecipientId = dmRecipient?.id;
  const isDmRecipientOnline = dmRecipientId
    ? onlineUsers[dmRecipientId] === UserStatus.ONLINE
    : false;

  const isChannelAdmin =
    activeChannel?.type !== ChannelType.DIRECT_MESSAGE &&
    (currentUser?.locRole === LocRole.LOC_PM ||
      activeChannel?.createdById === currentUser?.id ||
      activeChannel?.members?.some(
        (m) => m.userId === currentUser?.id && m.role?.toLowerCase() === "admin",
      ));

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-canvas">
      {/* 1. Channel Header Bar */}
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface-panel/85 px-4 py-2.5 font-sans text-xs text-slate-400 backdrop-blur-md">
        {/* Left: Channel Info or DM Recipient Info */}
        <div className="flex min-w-0 flex-1 items-center gap-3 truncate">
          {isDm ? (
            <>
              {/* Recipient Avatar Initials + Status Dot */}
              <div className="relative shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-accent-gold/30 bg-brand-navy font-mono text-[10px] font-bold text-accent-gold">
                  {(dmRecipientName || "DM").substring(0, 2).toUpperCase()}
                </div>
                <span
                  className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-surface-panel ${
                    isDmRecipientOnline ? "bg-emerald-400" : "bg-gray-600"
                  }`}
                />
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-white">{dmRecipientName}</span>
                {dmRecipient && <LocRoleBadge role={dmRecipient.locRole} />}
                {dmRecipient?.customStatus && (
                  <>
                    <div className="hidden h-3 w-px bg-white/10 sm:block" />
                    <span className="hidden truncate text-xs text-gray-400 italic sm:inline">
                      "{dmRecipient.customStatus}"
                    </span>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 1. Identity Capsule: Name + Locale Tag */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenChannelDetails}
                  className="group flex h-6 items-center gap-1 rounded-md px-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
                  title={t("channelDetails.title")}
                >
                  <Info className="h-3 w-3 text-slate-500 transition-colors group-hover:text-accent-gold" />
                  <span className="truncate group-hover:text-accent-gold">
                    #{activeChannel?.name || "select-channel"}
                  </span>
                </button>

                {activeChannel?.localeTag && (
                  <span className="flex h-6 shrink-0 items-center rounded-md border border-border-subtle bg-surface-card px-2 font-mono text-[11px] font-medium text-accent-gold">
                    {activeChannel.localeTag}
                  </span>
                )}
              </div>

              {/* 2. Channel Description / Topic */}
              {activeChannel?.description && (
                <>
                  <div className="hidden h-3 w-px bg-white/10 md:block" />
                  <button
                    type="button"
                    onClick={onOpenChannelDetails}
                    className="hidden max-w-xs cursor-pointer truncate text-left text-xs text-gray-400 transition-colors hover:text-slate-200 md:inline lg:max-w-md xl:max-w-lg"
                    title={activeChannel.description}
                  >
                    {activeChannel.description}
                  </button>
                </>
              )}

              {/* 3. Action Badges & Sprint Status */}
              {activeChannel && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="hidden h-3 w-px bg-white/10 sm:block" />

                  {/* Channel Members List Button */}
                  <button
                    type="button"
                    onClick={onOpenMembers}
                    className="flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border-subtle bg-surface-card px-2 text-[11px] font-medium text-gray-300 transition-colors hover:bg-surface-hover hover:text-white"
                    title="View Channel Members"
                  >
                    <Users className="h-3 w-3 text-accent-gold" />
                    <span>{t("chat.members")}</span>
                    {activeChannel.members && activeChannel.members.length > 0 && (
                      <span className="font-mono text-[10px] text-accent-gold">
                        {activeChannel.members.length}
                      </span>
                    )}
                  </button>

                  {/* Restore Pinned Sprint Status Banner */}
                  {activeChannel.status && !isBannerVisible && (
                    <button
                      type="button"
                      onClick={() => onRestoreBanner(activeChannel.id)}
                      className="flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 font-mono text-[11px] text-amber-300 transition-colors hover:bg-amber-500/20"
                      title="Restore pinned sprint status banner"
                    >
                      <Pin className="h-3 w-3 text-accent-gold" />
                      <span>{t("chat.sprintStatus")}</span>
                    </button>
                  )}

                  {/* Set Sprint Status Button for Admins (if none set) */}
                  {!activeChannel.status && isChannelAdmin && (
                    <button
                      type="button"
                      onClick={onOpenEditStatus}
                      className="flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-dashed border-border-subtle bg-surface-card px-2 font-mono text-[11px] text-gray-400 transition-colors hover:border-accent-gold/40 hover:bg-surface-hover hover:text-accent-gold"
                      title="Set sprint status for this channel"
                    >
                      <Pin className="h-2.5 w-2.5" />
                      <span>{t("chat.pinSprintStatus")}</span>
                    </button>
                  )}

                  {/* Admin Invite Button (for private channels) */}
                  {isChannelAdmin && activeChannel.type === ChannelType.PRIVATE_LOCALE && (
                    <button
                      type="button"
                      onClick={onOpenInvite}
                      className="flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-accent-gold/30 bg-brand-navy/80 px-2 text-[11px] font-medium text-accent-gold transition-colors hover:bg-brand-navy"
                      title="Invite Teammates to Private Channel"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>{t("chat.invite")}</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Search & Inspector Toggle Actions */}
        <div className="ml-3 flex shrink-0 items-center gap-1.5">
          {activeChannel && (
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((prev) => {
                  if (prev) {
                    setSearchQuery("");
                    return false;
                  }
                  return true;
                });
              }}
              className={`flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors ${
                isSearchOpen
                  ? "border border-accent-gold/30 bg-brand-navy text-accent-gold"
                  : "border border-transparent text-gray-400 hover:bg-surface-hover hover:text-white"
              }`}
              title={t("chat.search")}
            >
              <Search className="h-3 w-3" />
              <span>{t("chat.searchBtn")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleInspector}
            className={`flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors ${
              isInspectorOpen
                ? "border border-accent-gold/30 bg-brand-navy text-accent-gold"
                : "border border-transparent text-gray-400 hover:bg-surface-hover hover:text-white"
            }`}
            title={isInspectorOpen ? "Collapse String Inspector" : "Open String Inspector"}
          >
            <BookOpen className="h-3 w-3" />
            <span>{t("chat.inspector")}</span>
            {selectedStringKey && (
              <span className="py-0.2 rounded bg-black/30 px-1 font-mono text-[9px] text-accent-gold/90">
                #{selectedStringKey}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Messages Stream & Active Input */}
      {activeChannel ? (
        <div key={activeChannel.id} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Pinned Sprint Status Banner */}
          {isBannerVisible && (
            <div className="animate-in fade-in flex shrink-0 items-center justify-between border-b border-amber-500/20 bg-amber-500/[0.07] px-4 py-2 text-xs backdrop-blur-xs duration-150">
              <div className="flex min-w-0 items-center space-x-2.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-amber-500/30 bg-amber-500/15">
                  <Pin className="h-3.5 w-3.5 text-accent-gold" />
                </div>
                <div className="flex min-w-0 items-baseline space-x-2">
                  <span className="shrink-0 font-mono text-[10px] font-bold tracking-wider text-accent-gold uppercase">
                    {t("chat.sprintStatusLabel")}
                  </span>
                  <span className="truncate font-mono text-[11px] text-amber-200 select-text">
                    {activeChannel.status}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex shrink-0 items-center space-x-2">
                {isChannelAdmin && (
                  <button
                    type="button"
                    onClick={onOpenEditStatus}
                    className="flex cursor-pointer items-center space-x-1 rounded border border-border-subtle bg-surface-card px-2 py-0.5 font-mono text-[10px] text-gray-300 transition-colors hover:border-accent-gold/40 hover:bg-surface-hover hover:text-white"
                    title="Edit sprint status"
                  >
                    <Pencil className="h-2.5 w-2.5 text-accent-gold" />
                    <span>{t("chat.edit")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDismissBanner(activeChannel.id)}
                  className="cursor-pointer rounded p-1 text-gray-400 transition-colors hover:bg-surface-hover hover:text-white"
                  title="Hide sprint status banner"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Message Stream */}
          <MessageList
            channelId={activeChannel.id}
            channelName={isDm ? dmRecipientName : activeChannel.name}
            isDm={isDm}
            onSelectStringKey={onSelectStringKey}
            onOpenDm={onOpenDm}
            onReply={(msg) =>
              setReplyingTo({
                id: msg.id,
                senderName: msg.sender.displayName,
                content: msg.content,
              })
            }
            inspectedStringKey={selectedStringKey}
            highlightedTagKey={highlightedTagKey}
            onDismissTagHighlight={onDismissTagHighlight}
            onReportMatchesCount={onReportMatchesCount}
            isSearchOpen={isSearchOpen}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onCloseSearch={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
          />
          <TypingIndicator channelId={activeChannel.id} />
          <MessageInput
            channelId={activeChannel.id}
            channelName={isDm ? dmRecipientName : activeChannel.name}
            channelLocaleTag={activeChannel.localeTag}
            isDm={isDm}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center space-y-2 font-sans text-xs text-gray-500">
          <Terminal className="mb-2 h-8 w-8 text-gray-600" />
          <span>{t("chat.selectChannelPrompt")}</span>
        </div>
      )}
    </main>
  );
};

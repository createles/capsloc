import React from "react";
import { Terminal, BookOpen, UserPlus, Users, Pin, Pencil, X } from "lucide-react";
import { type ChannelDTO, ChannelType, UserStatus, type UserProfileDTO, LocRole } from "@capsloc/types";
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
  // Modals & Navigation triggers
  onOpenDm: (recipientId: string) => void;
  onOpenMembers: () => void;
  onOpenInvite: () => void;
  onOpenEditStatus: () => void;
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
  isBannerVisible,
  onDismissBanner,
  onRestoreBanner,
}) => {
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
      activeChannel?.members?.some((m) => m.userId === currentUser?.id && m.role?.toLowerCase() === "admin"));

  return (
    <main className="flex-1 flex flex-col bg-surface-canvas overflow-hidden min-w-0">
      {/* 1. Channel Header Bar */}
      <div
        className="border-b border-border-subtle bg-surface-panel/70 px-4 py-2.5 text-xs font-sans text-gray-400 flex items-center
  justify-between shrink-0"
      >
        {/* Left: Channel Info or DM Recipient Info */}
        <div className="flex items-center space-x-2.5 truncate min-w-0">
          {isDm ? (
            <>
              {/* Recipient Avatar Initials + Status Dot */}
              <div className="relative shrink-0">
                <div
                  className="h-7 w-7 rounded-md bg-brand-navy border border-accent-gold/30 flex items-center justify-center font-mono
  font-bold text-accent-gold text-[10px]"
                >
                  {(dmRecipientName || "DM").substring(0, 2).toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface-panel ${
                    isDmRecipientOnline ? "bg-emerald-400" : "bg-gray-600"
                  }`}
                />
              </div>

              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-white font-semibold text-sm truncate">{dmRecipientName}</span>
                {dmRecipient && <LocRoleBadge role={dmRecipient.locRole} />}
                {dmRecipient?.customStatus && (
                  <span className="text-xs italic text-gray-400 truncate hidden sm:inline">
                    "{dmRecipient.customStatus}"
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-1.5 min-w-0">
                <span className="text-white font-semibold text-sm truncate">
                  #{activeChannel?.name || "select-channel"}
                </span>
              </div>

              {activeChannel?.localeTag && (
                <span
                  className="rounded-md bg-brand-navy/60 px-2 py-0.5 text-[10px] font-mono text-accent-gold border border-accent-gold/20
  shrink-0"
                >
                  {activeChannel.localeTag}
                </span>
              )}
              {activeChannel?.description && (
                <span className="text-gray-400 text-xs truncate max-w-md hidden md:inline ml-2">
                  {activeChannel.description}
                </span>
              )}

              {/* Channel Members List Button */}
              {activeChannel && (
                <button
                  type="button"
                  onClick={onOpenMembers}
                  className="flex items-center space-x-1 ml-2 rounded bg-surface-card hover:bg-surface-hover text-gray-300 hover:text-white
  border border-border-subtle px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer shrink-0"
                  title="View Channel Members"
                >
                  <Users className="h-3 w-3 text-accent-gold" />
                  <span>Members</span>
                </button>
              )}

              {/* Restore Pinned Sprint Status Banner */}
              {activeChannel?.status && !isBannerVisible && (
                <button
                  type="button"
                  onClick={() => onRestoreBanner(activeChannel.id)}
                  className="flex items-center space-x-1 ml-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono transition-colors cursor-pointer shrink-0"
                  title="Restore pinned sprint status banner"
                >
                  <Pin className="h-2.5 w-2.5 text-accent-gold" />
                  <span>Sprint Status</span>
                </button>
              )}

              {/* Set Sprint Status Button for Admins (if none set) */}
              {!activeChannel?.status && isChannelAdmin && (
                <button
                  type="button"
                  onClick={onOpenEditStatus}
                  className="flex items-center space-x-1 ml-1.5 rounded bg-surface-card hover:bg-surface-hover text-gray-400 hover:text-accent-gold border border-dashed border-border-subtle hover:border-accent-gold/40 px-2 py-0.5 text-[10px] font-mono transition-colors cursor-pointer shrink-0"
                  title="Set sprint status for this channel"
                >
                  <Pin className="h-2.5 w-2.5" />
                  <span>Pin Sprint Status</span>
                </button>
              )}

              {/* Admin Invite Button (for private channels) */}
              {isChannelAdmin && activeChannel?.type === ChannelType.PRIVATE_LOCALE && (
                <button
                  type="button"
                  onClick={onOpenInvite}
                  className="flex items-center space-x-1 ml-1 rounded bg-brand-navy/80 hover:bg-brand-navy text-accent-gold border border-accent-gold/30 px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer shrink-0"
                  title="Invite Teammates to Private Channel"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Invite</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Right: Inspector Toggle Action */}
        <div className="flex items-center space-x-2 shrink-0 ml-3">
          <button
            type="button"
            onClick={onToggleInspector}
            className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer shrink-0 ${
              isInspectorOpen
                ? "bg-brand-navy text-accent-gold border border-accent-gold/30"
                : "text-gray-400 hover:text-white hover:bg-surface-hover border border-transparent"
            }`}
            title={isInspectorOpen ? "Collapse String Inspector" : "Open String Inspector"}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Inspector</span>
            {selectedStringKey && (
              <span className="font-mono text-[10px] text-accent-gold/90 bg-black/30 px-1.5 py-0.2 rounded">
                #{selectedStringKey}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Messages Stream & Active Input */}
      {activeChannel ? (
        <div key={activeChannel.id} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Pinned Sprint Status Banner */}
          {isBannerVisible && (
            <div className="border-b border-amber-500/20 bg-amber-500/[0.07] px-4 py-2 flex items-center justify-between text-xs backdrop-blur-xs shrink-0 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="h-6 w-6 rounded bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Pin className="h-3.5 w-3.5 text-accent-gold" />
                </div>
                <div className="min-w-0 flex items-baseline space-x-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-accent-gold tracking-wider shrink-0">
                    Sprint Status:
                  </span>
                  <span className="font-mono text-[11px] text-amber-200 truncate select-text">
                    {activeChannel.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 ml-3">
                {isChannelAdmin && (
                  <button
                    type="button"
                    onClick={onOpenEditStatus}
                    className="flex items-center space-x-1 rounded bg-surface-card hover:bg-surface-hover border border-border-subtle
  hover:border-accent-gold/40 text-gray-300 hover:text-white px-2 py-0.5 text-[10px] font-mono transition-colors cursor-pointer"
                    title="Edit sprint status"
                  >
                    <Pencil className="h-2.5 w-2.5 text-accent-gold" />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDismissBanner(activeChannel.id)}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
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
            onSelectStringKey={onSelectStringKey}
            onOpenDm={onOpenDm}
            inspectedStringKey={selectedStringKey}
            highlightedTagKey={highlightedTagKey}
            onDismissTagHighlight={onDismissTagHighlight}
            onReportMatchesCount={onReportMatchesCount}
          />
          <TypingIndicator channelId={activeChannel.id} />
          <MessageInput
            channelId={activeChannel.id}
            channelName={isDm ? dmRecipientName : activeChannel.name}
            isDm={isDm}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center font-sans text-xs text-gray-500 space-y-2">
          <Terminal className="h-8 w-8 text-gray-600 mb-2" />
          <span>Select a channel to start messaging</span>
        </div>
      )}
    </main>
  );
};

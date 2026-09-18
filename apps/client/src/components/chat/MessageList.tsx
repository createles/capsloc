import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Loader2,
  Image as ImageIcon,
  FileText,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import {
  UserStatus,
  type MessageDTO,
  type PaginatedMessagesDTO,
} from "@capsloc/types";
import { api } from "../../services/api";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { LocRoleBadge } from "../ui/LocRoleBadge";
import { ImageLightboxModal } from "./ImageLightBoxModal";
import { UserProfileHoverCard } from "../common/UserProfileHoverCard";
import { type AttachmentDTO } from "@capsloc/types";

export interface MessageListProps {
  channelId: string;
  onSelectStringKey: (stringKey: string) => void;
  onOpenDm?: (targetUserId: string) => void;
  inspectedStringKey?: string | null;
  highlightedTagKey?: string | null;
  onDismissTagHighlight?: () => void;
  onReportMatchesCount?: (count: number) => void;
}

/**
 * Smart Highlighter: Parses message text and wraps #LOC-XXXX, $STR_XXXX,
 * and @mentions in interactive, clickable badges.
 */
export const SmartMessageContent: React.FC<{
  content: string;
  currentUsername?: string;
  onSelectStringKey: (stringKey: string) => void;
}> = ({ content, currentUsername: _currentUsername, onSelectStringKey }) => {
  const regex =
    /(#?[A-Z0-9_-]*LOC-[A-Z0-9_-]+|\$STR_[A-Z0-9_]+|@[a-zA-Z0-9_.-]+)/gi;
  const parts = content.split(regex);

  return (
    <span className="whitespace-pre-wrap leading-relaxed text-gray-200 font-sans">
      {parts.map((part, index) => {
        if (!part) return null;

        // LOC String Tag Match - High-visibility String Literal Syntax Tag
        if (
          part.match(/^#?[A-Z0-9_-]*LOC-[A-Z0-9_-]+$/i) ||
          part.match(/^\$STR_[A-Z0-9_]+$/i)
        ) {
          const cleanKey = part.replace(/^#/, "");
          const displayLabel =
            part.startsWith("#") || part.startsWith("$") ? part : `#${part}`;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectStringKey(cleanKey)}
              className="inline-flex items-center rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/70 hover:border-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer px-2 py-0.5 font-mono text-[11px] font-bold tracking-tight mx-0.5 align-baseline shadow-xs"
            >
              {displayLabel}
            </button>
          );
        }

        // @User Mention Tag Match - Bold with underline (no pill)
        if (part.startsWith("@")) {
          const cleanUsername = part.slice(1);
          return (
            <span
              key={index}
              className={`font-bold transition-colors mx-0.5 text-accent-gold decoration-accent-gold/70 hover:decoration-accent-gold`}
            >
              @{cleanUsername}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

/**
 * Message skeleton placeholder for chat transitions
 */
const MessageSkeleton: React.FC = () => (
  <div className="flex-1 overflow-hidden px-4 py-3 space-y-4 animate-pulse select-none">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="flex items-start space-x-3">
        {/* Avatar skeleton */}
        <div className="h-8 w-8 rounded-lg bg-surface-card/60 border border-border-subtle/50 shrink-0 mt-0.5" />
        {/* Body skeleton */}
        <div className="flex-1 space-y-2 py-1">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-24 rounded bg-surface-card/80" />
            <div className="h-2.5 w-16 rounded bg-surface-card/50" />
            <div className="h-2.5 w-10 rounded bg-surface-card/30" />
          </div>
          <div
            className="h-3 rounded bg-surface-card/40"
            style={{ width: `${55 + ((i * 19) % 40)}%` }}
          />
          {i % 2 === 0 && (
            <div
              className="h-3 rounded bg-surface-card/30"
              style={{ width: `${35 + ((i * 23) % 45)}%` }}
            />
          )}
        </div>
      </div>
    ))}
  </div>
);

export const MessageList: React.FC<MessageListProps> = ({
  channelId,
  onSelectStringKey,
  onOpenDm,
  inspectedStringKey,
  highlightedTagKey,
  onDismissTagHighlight,
  onReportMatchesCount,
}) => {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers, joinChannel, leaveChannel } =
    useSocket();
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [activeLightbox, setActiveLightbox] = useState<{
    attachment: AttachmentDTO;
    uploaderName?: string;
  } | null>(null); // Lightbox state handler

  // Scroll management & unread tracking:
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isAtBottomRef = useRef<boolean>(true);
  const isInitialLoadRef = useRef<boolean>(true); // Tracks initial asset load settling
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // In-chat tag highlight & jump navigation:
  const matchingMessageIds = useMemo(() => {
    if (!highlightedTagKey) return [];
    const tag = highlightedTagKey.toLowerCase().replace(/^#/, "");
    return messages
      .filter((m) => m.content.toLowerCase().includes(tag))
      .map((m) => m.id);
  }, [messages, highlightedTagKey]);

  // Count occurrences of currently inspected string in this channel (independent of active highlighting)
  const inspectedMatchesCount = useMemo(() => {
    if (!inspectedStringKey) return 0;
    const cleanKey = inspectedStringKey.toLowerCase().replace(/^#/, "");
    return messages.filter((m) => m.content.toLowerCase().includes(cleanKey))
      .length;
  }, [messages, inspectedStringKey]);

  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0); // Initial tag match index

  // Adjust state during render when highlighted tag changes:
  const [prevTagKey, setPrevTagKey] = useState(highlightedTagKey);
  if (highlightedTagKey !== prevTagKey) {
    setPrevTagKey(highlightedTagKey);
    setCurrentMatchIndex(0);
  }

  // Reset current match index when tag changes
  useEffect(() => {
    if (highlightedTagKey && matchingMessageIds.length > 0 && matchingMessageIds[0]) {
      const firstId = matchingMessageIds[0];
      const timer = setTimeout(() => {
        const el = messageRefs.current[firstId];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedTagKey, matchingMessageIds]);

  // Report match count to parent / inspector
  useEffect(() => {
    onReportMatchesCount?.(inspectedMatchesCount);
  }, [inspectedMatchesCount, onReportMatchesCount]);

  const scrollToMatch = (index: number) => {
    const targetId = matchingMessageIds[index];
    if (!targetId) return;
    const el = messageRefs.current[targetId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchingMessageIds.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMatch(nextIdx);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const prevIdx =
      (currentMatchIndex - 1 + matchingMessageIds.length) %
      matchingMessageIds.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(prevIdx);
  };

  // Declarative Room Subscription
  useEffect(() => {
    if (!channelId || !isConnected) return;
    joinChannel(channelId);
    return () => {
      leaveChannel(channelId);
    };
  }, [channelId, isConnected, joinChannel, leaveChannel]);

  // Initial message history fetch with 250ms minimum loading display floor
  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();
    const MIN_SKELETON_MS = 250;

    isInitialLoadRef.current = true;

    const fetchHistory = async () => {
      try {
        const { data } = await api.get<PaginatedMessagesDTO>(
          `/channels/${channelId}/messages?limit=30`,
        );

        const elapsed = Date.now() - startTime;
        const delayRemaining = Math.max(0, MIN_SKELETON_MS - elapsed);

        setTimeout(() => {
          if (isMounted) {
            setMessages([...data.messages].reverse());
            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
            setUnreadCount(0);
            setIsLoading(false);
          }
        }, delayRemaining);
      } catch (err) {
        console.error("Failed to load message history:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [channelId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    }
    bottomRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom on initial load with ResizeObserver for async image/font expansion
  useEffect(() => {
    if (!containerRef.current || isLoading) return;

    // Observe container resizing as images & fonts expand asynchronously
    const resizeObserver = new ResizeObserver(() => {
      if (isInitialLoadRef.current || isAtBottomRef.current) {
        scrollToBottom("instant");
      }
    });

    resizeObserver.observe(containerRef.current);

    // Initial paint-delayed scroll
    const timer = setTimeout(() => {
      scrollToBottom("instant");
      // Settle initial load window after 1.5s
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 1500);
    }, 50);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [isLoading, channelId]);

  // Scroll event handler with 80px bottom threshold
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const atBottom = distanceFromBottom < 80;

    isAtBottomRef.current = atBottom;
    if (atBottom) {
      setUnreadCount(0);
    }
  };

  // Real-time socket message listener with Scroll-Lock
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage: MessageDTO) => {
      if (newMessage.channelId !== channelId) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      const isOwnMessage = newMessage.senderId === user?.id;

      if (isOwnMessage || isAtBottomRef.current) {
        // Align auto-scroll with browser rendering frame
        requestAnimationFrame(() => {
          scrollToBottom("smooth");
        });
      } else {
        // SCROLL-LOCK: User is scrolled up reading history
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, channelId, user?.id]);

  // Cursor pagination: Load earlier history
  const loadEarlierMessages = async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const { data } = await api.get<PaginatedMessagesDTO>(
        `/channels/${channelId}/messages?limit=30&cursor=${nextCursor}`,
      );
      setMessages((prev) => [...[...data.messages].reverse(), ...prev]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Failed to paginate messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateDivider = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return <MessageSkeleton />;
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      {/* Floating Jump Controller for In-Chat Tag Mentions */}
      {highlightedTagKey && matchingMessageIds.length > 0 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2.5 rounded-full bg-surface-panel/95 backdrop-blur-md border border-accent-gold/40 shadow-2xl px-3.5 py-1.5 font-sans text-xs select-none animate-in fade-in slide-in-from-top-2">
          <span className="font-mono font-bold text-accent-gold text-[11px]">
            #{highlightedTagKey.replace(/^#/, "")}
          </span>
          <span className="text-gray-300 font-mono text-[11px]">
            {currentMatchIndex + 1} of {matchingMessageIds.length} mentions
          </span>
          <div className="flex items-center space-x-1 border-l border-border-subtle pl-2">
            <button
              type="button"
              onClick={handlePrevMatch}
              className="p-1 rounded hover:bg-surface-hover text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Previous mention (Up)"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMatch}
              className="p-1 rounded hover:bg-surface-hover text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Next mention (Down)"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          {onDismissTagHighlight && (
            <button
              type="button"
              onClick={onDismissTagHighlight}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer ml-1 border-l border-border-subtle pl-2"
              title="Close jump bar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 select-text"
      >
        {/* Load Earlier Messages Button */}
        {hasMore && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={loadEarlierMessages}
              disabled={isLoadingMore}
              className="flex items-center space-x-1.5 rounded-md border border-border-subtle bg-surface-card px-3 py-1 font-sans text-xs text-gray-400 hover:border-accent-gold/40 hover:text-accent-gold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoadingMore ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-gold" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
              <span>Load older messages</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 font-sans text-xs py-16">
            <span className="font-medium text-gray-400 text-sm">
              No messages yet
            </span>
            <span className="text-[11px] text-gray-500 mt-1">
              Messages with #LOC-XXXX or $STR_XXXX tags are automatically linked
              for inspection.
            </span>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const currentDate = new Date(message.createdAt);
            const prevDate = prevMessage
              ? new Date(prevMessage.createdAt)
              : null;

            // Date divider check (day boundary)
            const showDateDivider =
              !prevDate ||
              currentDate.toDateString() !== prevDate.toDateString();

            const isMentioned =
              !!user?.username &&
              message.content
                .toLowerCase()
                .includes(`@${user.username.toLowerCase()}`);

            // Clustering check: same sender within 5 minutes on the same day (mentions break cluster for visibility)
            const isClustered =
              !showDateDivider &&
              !isMentioned &&
              prevMessage !== null &&
              prevMessage.senderId === message.senderId &&
              currentDate.getTime() - (prevDate?.getTime() || 0) < 300000;

            const isMatch = matchingMessageIds.includes(message.id);
            const isCurrentMatch =
              isMatch && matchingMessageIds[currentMatchIndex] === message.id;

            const initials = message.sender.displayName
              .substring(0, 2)
              .toUpperCase();

            return (
              <React.Fragment key={message.id}>
                {/* Calendar Day Date Divider */}
                {showDateDivider && (
                  <div className="flex items-center my-4 select-none">
                    <div className="flex-1 border-t border-border-subtle" />
                    <span className="mx-3 rounded-full bg-surface-card border border-border-subtle px-3 py-0.5 text-[11px] font-sans font-medium text-gray-400">
                      {formatDateDivider(message.createdAt)}
                    </span>
                    <div className="flex-1 border-t border-border-subtle" />
                  </div>
                )}

                {/* Message Item */}
                <div
                  ref={(el) => {
                    messageRefs.current[message.id] = el;
                  }}
                  className={`flex items-start space-x-3 group hover:bg-surface-panel/40 -mx-4 px-4 rounded transition-all ${
                    isClustered ? "py-1" : "pt-2.5 pb-1"
                  } ${
                    isCurrentMatch
                      ? "bg-accent-gold/20 ring-2 ring-accent-gold rounded-lg shadow-md -mx-2 px-2"
                      : isMatch
                        ? "bg-accent-gold/[0.08] ring-1 ring-accent-gold/40 rounded-lg -mx-2 px-2"
                        : isMentioned
                          ? "bg-accent-gold/[0.04] border-l-2 border-accent-gold pl-3.5"
                          : ""
                  }`}
                >
                  {isClustered ? (
                    // Grouped follow-up: compact single-line timestamp on hover (never wraps)
                    <div className="w-8 shrink-0 text-right flex items-center justify-end select-none h-5">
                      <span className="text-[9px] font-mono tabular-nums text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity leading-none">
                        {formatTimestamp(message.createdAt)}
                      </span>
                    </div>
                  ) : (
                    // First in cluster: avatar with hover card
                    <UserProfileHoverCard
                      user={message.sender}
                      isOnline={
                        onlineUsers[message.sender.id] === UserStatus.ONLINE
                      }
                      isSelf={message.sender.id === user?.id}
                      onSendDm={
                        onOpenDm ? () => onOpenDm(message.sender.id) : undefined
                      }
                      side="bottom"
                    >
                      <div className="h-8 w-8 rounded-lg bg-brand-navy border border-accent-gold/20 flex items-center justify-center font-mono font-bold text-accent-gold text-xs shrink-0 mt-0.5 cursor-pointer hover:border-accent-gold transition-colors">
                        {initials}
                      </div>
                    </UserProfileHoverCard>
                  )}

                  {/* Body */}
                  <div className="flex-1 overflow-hidden space-y-0.5 min-w-0">
                    {!isClustered && (
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-white">
                          {message.sender.displayName}
                        </span>
                        <LocRoleBadge role={message.sender.locRole} />
                        <span className="text-[10px] font-mono text-gray-500">
                          {formatTimestamp(message.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="text-xs text-gray-300">
                      <SmartMessageContent
                        content={message.content}
                        currentUsername={user?.username}
                        onSelectStringKey={onSelectStringKey}
                      />
                    </div>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((att) => {
                          const isImage =
                            att.fileType === "IMAGE" ||
                            att.fileType === "SCREENSHOT_BUG";

                          return (
                            <div
                              key={att.id}
                              className="w-fit min-w-55 max-w-md rounded-lg border border-border-subtle bg-surface-card p-2 text-xs"
                            >
                              {/* Attachment Header */}
                              <div className="flex items-center space-x-2 mb-1.5 text-gray-300 font-sans text-xs">
                                {isImage ? (
                                  <ImageIcon className="h-3.5 w-3.5 text-accent-gold shrink-0" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                )}
                                <span className="truncate">{att.fileName}</span>
                                <span className="text-gray-500 text-[10px] font-mono shrink-0">
                                  ({(att.fileSize / 1024).toFixed(1)} KB)
                                </span>
                                {att.localeTag && (
                                  <span
                                    className="ml-auto rounded bg-brand-navy px-1.5 py-0.2 text-[9px] font-mono text-accent-gold border border-accent-gold/30
  uppercase shrink-0"
                                  >
                                    {att.localeTag}
                                  </span>
                                )}
                              </div>

                              {/* Centered Image Thumbnail with Snug Wrapper */}
                              {isImage && (
                                <div className="rounded-md overflow-hidden border border-border-subtle bg-black/30 flex items-center justify-center">
                                  <img
                                    src={att.fileUrl}
                                    alt={att.fileName}
                                    // Re-scroll to bottom as each image finishes downloading
                                    onLoad={() => {
                                      if (
                                        isInitialLoadRef.current ||
                                        isAtBottomRef.current
                                      ) {
                                        scrollToBottom("instant");
                                      }
                                    }}
                                    className="max-h-60 w-auto object-contain cursor-pointer hover:opacity-95 transition-opacity rounded"
                                    onClick={() =>
                                      setActiveLightbox({
                                        attachment: att,
                                        uploaderName:
                                          message.sender.displayName,
                                      })
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        <div ref={bottomRef} className="h-6 shrink-0" />
      </div>

      {/* Floating Unread Counter Action Banner */}
      {unreadCount > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
          <button
            type="button"
            onClick={() => {
              scrollToBottom("smooth");
              setUnreadCount(0);
            }}
            className="flex items-center space-x-2 rounded-full bg-brand-navy border border-accent-gold/40 shadow-xl px-4 py-1.5 text-xs
  font-sans font-medium text-accent-gold hover:bg-brand-navy-light hover:border-accent-gold transition-all animate-bounce cursor-pointer"
          >
            <span>
              {unreadCount} {unreadCount === 1 ? "New Message" : "New Messages"}
            </span>
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Lightbox Modal for Images */}
      {activeLightbox && (
        <ImageLightboxModal
          attachment={activeLightbox.attachment}
          uploaderName={activeLightbox.uploaderName}
          onClose={() => setActiveLightbox(null)}
          onSelectStringKey={onSelectStringKey}
        />
      )}
    </div>
  );
};

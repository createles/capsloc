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
  Copy,
  Check,
  FileCode,
} from "lucide-react";
import { UserStatus, type MessageDTO, type PaginatedMessagesDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../i18n";
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
  const regex = /(#?[A-Z0-9_-]*LOC-[A-Z0-9_-]+|\$STR_[A-Z0-9_]+|@[a-zA-Z0-9_.-]+)/gi;
  const parts = content.split(regex);

  return (
    <span className="font-sans leading-relaxed whitespace-pre-wrap text-gray-200">
      {parts.map((part, index) => {
        if (!part) return null;

        // LOC String Tag Match - High-visibility String Literal Syntax Tag
        if (part.match(/^#?[A-Z0-9_-]*LOC-[A-Z0-9_-]+$/i) || part.match(/^\$STR_[A-Z0-9_]+$/i)) {
          const cleanKey = part.replace(/^#/, "");
          const displayLabel = part.startsWith("#") || part.startsWith("$") ? part : `#${part}`;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectStringKey(cleanKey)}
              className="mx-0.5 inline-flex cursor-pointer items-center rounded border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 align-baseline font-mono text-[11px] font-bold tracking-tight text-emerald-400 shadow-xs transition-colors hover:border-emerald-300 hover:bg-emerald-900/70 hover:text-emerald-200"
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
              className={`mx-0.5 font-bold text-accent-gold decoration-accent-gold/70 transition-colors hover:decoration-accent-gold`}
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
 * Floating hover toolbar for individual messages
 */
const MessageHoverBar: React.FC<{
  content: string;
  onSelectStringKey?: (key: string) => void;
}> = ({ content, onSelectStringKey }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const tagMatch = content.match(/(#LOC-[A-Z0-9_-]+|\$STR_[A-Z0-9_]+)/i);
  const matchedKey = tagMatch ? tagMatch[0].replace(/^[#$]/, "") : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  };

  return (
    <div className="absolute -top-3.5 right-3 z-10 hidden items-center space-x-0.5 rounded-lg border border-border-subtle bg-surface-card/95 px-1 py-0.5 shadow-md backdrop-blur-md group-hover:flex">
      <button
        type="button"
        onClick={handleCopy}
        className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-surface-hover hover:text-white"
        title={t("message.copyText")}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>

      {matchedKey && onSelectStringKey && (
        <button
          type="button"
          onClick={() => onSelectStringKey(matchedKey)}
          className="cursor-pointer rounded p-1 text-emerald-400 transition-colors hover:bg-emerald-950/50 hover:text-emerald-300"
          title={`${t("message.inspectTag")} ${tagMatch?.[0]}`}
        >
          <FileCode className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

/**
 * Message skeleton placeholder for chat transitions
 */
const MessageSkeleton: React.FC = () => (
  <div className="flex-1 animate-pulse space-y-4 overflow-hidden px-4 py-3 select-none">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="flex items-start space-x-3">
        {/* Avatar skeleton */}
        <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-border-subtle/50 bg-surface-card/60" />
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
  const { socket, isConnected, onlineUsers, joinChannel, leaveChannel } = useSocket();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [activeLightbox, setActiveLightbox] = useState<{
    attachment: AttachmentDTO;
    uploaderName?: string;
  } | null>(null);

  // Scroll management & unread tracking:
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isAtBottomRef = useRef<boolean>(true);
  const isInitialLoadRef = useRef<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // In-chat tag highlight & jump navigation:
  const matchingMessageIds = useMemo(() => {
    if (!highlightedTagKey) return [];
    const tag = highlightedTagKey.toLowerCase().replace(/^#/, "");
    return messages.filter((m) => m.content.toLowerCase().includes(tag)).map((m) => m.id);
  }, [messages, highlightedTagKey]);

  const inspectedMatchesCount = useMemo(() => {
    if (!inspectedStringKey) return 0;
    const cleanKey = inspectedStringKey.toLowerCase().replace(/^#/, "");
    return messages.filter((m) => m.content.toLowerCase().includes(cleanKey)).length;
  }, [messages, inspectedStringKey]);

  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

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
    const prevIdx = (currentMatchIndex - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(prevIdx);
  };

  useEffect(() => {
    if (!channelId || !isConnected) return;
    joinChannel(channelId);
    return () => {
      leaveChannel(channelId);
    };
  }, [channelId, isConnected, joinChannel, leaveChannel]);

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

  useEffect(() => {
    if (!containerRef.current || isLoading) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isInitialLoadRef.current || isAtBottomRef.current) {
        scrollToBottom("instant");
      }
    });

    resizeObserver.observe(containerRef.current);

    const timer = setTimeout(() => {
      scrollToBottom("instant");
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 1500);
    }, 50);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [isLoading, channelId]);

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
        requestAnimationFrame(() => {
          scrollToBottom("smooth");
        });
      } else {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [socket, channelId, user?.id]);

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

    if (date.toDateString() === today.toDateString()) return t("message.today");
    if (date.toDateString() === yesterday.toDateString()) return t("message.yesterday");
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
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Floating Jump Controller for In-Chat Tag Mentions */}
      {highlightedTagKey && matchingMessageIds.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute top-2 left-1/2 z-30 flex -translate-x-1/2 items-center space-x-2.5 rounded-full border border-accent-gold/40 bg-surface-panel/95 px-3.5 py-1.5 font-sans text-xs shadow-2xl backdrop-blur-md select-none">
          <span className="font-mono text-[11px] font-bold text-accent-gold">
            #{highlightedTagKey.replace(/^#/, "")}
          </span>
          <span className="font-mono text-[11px] text-gray-300">
            {t("message.mentionsCount", {
              current: currentMatchIndex + 1,
              total: matchingMessageIds.length,
            })}
          </span>
          <div className="flex items-center space-x-1 border-l border-border-subtle pl-2">
            <button
              type="button"
              onClick={handlePrevMatch}
              className="cursor-pointer rounded p-1 text-gray-300 transition-colors hover:bg-surface-hover hover:text-white"
              title="Previous mention (Up)"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMatch}
              className="cursor-pointer rounded p-1 text-gray-300 transition-colors hover:bg-surface-hover hover:text-white"
              title="Next mention (Down)"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          {onDismissTagHighlight && (
            <button
              type="button"
              onClick={onDismissTagHighlight}
              className="ml-1 cursor-pointer rounded border-l border-border-subtle p-1 pl-2 text-gray-400 transition-colors hover:bg-surface-hover hover:text-white"
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
        className="flex-1 space-y-1 overflow-y-auto px-4 py-3 select-text"
      >
        {/* Load Earlier Messages Button */}
        {hasMore && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={loadEarlierMessages}
              disabled={isLoadingMore}
              className="flex cursor-pointer items-center space-x-1.5 rounded-md border border-border-subtle bg-surface-card px-3 py-1 font-sans text-xs text-gray-400 transition-colors hover:border-accent-gold/40 hover:text-accent-gold disabled:opacity-50"
            >
              {isLoadingMore ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-gold" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
              <span>{t("message.loadOlder")}</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center font-sans text-xs text-gray-500">
            <span className="text-sm font-medium text-gray-400">{t("message.noMessages")}</span>
            <span className="mt-1 text-[11px] text-gray-500">{t("message.emptyGuide")}</span>
          </div>
        ) : (
          messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const currentDate = new Date(message.createdAt);
            const prevDate = prevMessage ? new Date(prevMessage.createdAt) : null;

            // Date divider check (day boundary)
            const showDateDivider =
              !prevDate || currentDate.toDateString() !== prevDate.toDateString();

            const isMentioned =
              !!user?.username &&
              message.content.toLowerCase().includes(`@${user.username.toLowerCase()}`);

            const isClustered =
              !showDateDivider &&
              !isMentioned &&
              prevMessage !== null &&
              prevMessage.senderId === message.senderId &&
              currentDate.getTime() - (prevDate?.getTime() || 0) < 300000;

            const isMatch = matchingMessageIds.includes(message.id);
            const isCurrentMatch = isMatch && matchingMessageIds[currentMatchIndex] === message.id;

            const initials = message.sender.displayName.substring(0, 2).toUpperCase();

            return (
              <React.Fragment key={message.id}>
                {/* Calendar Day Date Divider */}
                {showDateDivider && (
                  <div className="my-4 flex items-center select-none">
                    <div className="flex-1 border-t border-border-subtle" />
                    <span className="mx-3 rounded-full border border-border-subtle bg-surface-panel/80 px-3 py-0.5 font-mono text-[10px] font-medium text-slate-400 shadow-xs">
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
                  className={`group relative -mx-4 flex items-start space-x-3 rounded-lg px-4 transition-all hover:bg-white/[0.03] ${
                    isClustered ? "py-1" : "pt-2.5 pb-1"
                  } ${
                    isCurrentMatch
                      ? "-mx-2 rounded-lg bg-accent-gold/20 px-2 shadow-md ring-2 ring-accent-gold"
                      : isMatch
                        ? "-mx-2 rounded-lg bg-accent-gold/[0.08] px-2 ring-1 ring-accent-gold/40"
                        : isMentioned
                          ? "border-l-2 border-accent-gold bg-accent-gold/[0.04] pl-3.5"
                          : ""
                  }`}
                >
                  {/* Floating Action Bar on Hover */}
                  <MessageHoverBar
                    content={message.content}
                    onSelectStringKey={onSelectStringKey}
                  />

                  {isClustered ? (
                    <div className="flex h-5 w-8 shrink-0 items-center justify-end text-right select-none">
                      <span className="font-mono text-[9px] leading-none whitespace-nowrap text-slate-500 tabular-nums opacity-0 transition-opacity group-hover:opacity-100">
                        {formatTimestamp(message.createdAt)}
                      </span>
                    </div>
                  ) : (
                    <UserProfileHoverCard
                      user={message.sender}
                      isOnline={onlineUsers[message.sender.id] === UserStatus.ONLINE}
                      isSelf={message.sender.id === user?.id}
                      onSendDm={onOpenDm ? () => onOpenDm(message.sender.id) : undefined}
                      side="bottom"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-accent-gold/20 bg-brand-navy font-mono text-xs font-bold text-accent-gold shadow-xs transition-all hover:border-accent-gold hover:shadow-sm">
                        {initials}
                      </div>
                    </UserProfileHoverCard>
                  )}

                  {/* Body */}
                  <div className="min-w-0 flex-1 space-y-0.5 overflow-hidden">
                    {!isClustered && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">
                          {message.sender.displayName}
                        </span>
                        <LocRoleBadge role={message.sender.locRole} />
                        <span className="font-mono text-[10px] text-slate-500">
                          {formatTimestamp(message.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="text-sm leading-relaxed text-slate-200 select-text">
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
                            att.fileType === "IMAGE" || att.fileType === "SCREENSHOT_BUG";

                          return (
                            <div
                              key={att.id}
                              className="w-fit max-w-md min-w-55 rounded-lg border border-border-subtle bg-surface-card p-2 text-xs"
                            >
                              {/* Attachment Header */}
                              <div className="mb-1.5 flex items-center space-x-2 font-sans text-xs text-gray-300">
                                {isImage ? (
                                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-accent-gold" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                                )}
                                <span className="truncate">{att.fileName}</span>
                                <span className="shrink-0 font-mono text-[10px] text-gray-500">
                                  ({(att.fileSize / 1024).toFixed(1)} KB)
                                </span>
                                {att.localeTag && (
                                  <span className="py-0.2 ml-auto shrink-0 rounded border border-accent-gold/30 bg-brand-navy px-1.5 font-mono text-[9px] text-accent-gold uppercase">
                                    {att.localeTag}
                                  </span>
                                )}
                              </div>

                              {/* Centered Image Thumbnail with Snug Wrapper */}
                              {isImage && (
                                <div className="flex items-center justify-center overflow-hidden rounded-md border border-border-subtle bg-black/30">
                                  <img
                                    src={att.fileUrl}
                                    alt={att.fileName}
                                    onLoad={() => {
                                      if (isInitialLoadRef.current || isAtBottomRef.current) {
                                        scrollToBottom("instant");
                                      }
                                    }}
                                    className="max-h-60 w-auto cursor-pointer rounded object-contain transition-opacity hover:opacity-95"
                                    onClick={() =>
                                      setActiveLightbox({
                                        attachment: att,
                                        uploaderName: message.sender.displayName,
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
        <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
          <button
            type="button"
            onClick={() => {
              scrollToBottom("smooth");
              setUnreadCount(0);
            }}
            className="flex animate-bounce cursor-pointer items-center space-x-2 rounded-full border border-accent-gold/40 bg-brand-navy px-4 py-1.5 font-sans text-xs font-medium text-accent-gold shadow-xl transition-all hover:border-accent-gold hover:bg-brand-navy-light"
          >
            <span>
              {t(unreadCount === 1 ? "message.newMessage" : "message.newMessages", {
                count: unreadCount,
              })}
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

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
  MessageSquare,
  Reply,
  Search,
} from "lucide-react";
import {
  UserStatus,
  type MessageDTO,
  type PaginatedMessagesDTO,
  type UserProfileDTO,
} from "@capsloc/types";
import { api } from "../../services/api";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../i18n";
import { LocRoleBadge } from "../ui/LocRoleBadge";
import { ImageLightboxModal } from "./ImageLightBoxModal";
import { UserProfileHoverCard } from "../common/UserProfileHoverCard";
import { type AttachmentDTO } from "@capsloc/types";
import { cn } from "../../lib/utils";

export interface MessageListProps {
  channelId: string;
  channelName?: string | null;
  isDm?: boolean;
  onSelectStringKey: (stringKey: string) => void;
  onOpenDm?: (targetUserId: string) => void;
  onReply?: (message: MessageDTO) => void;
  inspectedStringKey?: string | null;
  highlightedTagKey?: string | null;
  onDismissTagHighlight?: () => void;
  onReportMatchesCount?: (count: number) => void;
  isSearchOpen?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onCloseSearch?: () => void;
}

/**
 * Smart Highlighter: Parses message text and wraps #LOC-XXXX, $STR_XXXX,
 * and @mentions in interactive, clickable badges. Supports markdown blockquotes (> ).
 */
export const SmartMessageContent: React.FC<{
  content: string;
  currentUsername?: string;
  onSelectStringKey: (stringKey: string) => void;
}> = ({ content, onSelectStringKey }) => {
  const lines = content.split("\n");
  const quoteLines: string[] = [];
  const bodyLines: string[] = [];
  let isParsingQuote = true;

  for (const line of lines) {
    if (isParsingQuote && line.startsWith("> ")) {
      quoteLines.push(line.slice(2));
    } else {
      if (line.trim() !== "" || quoteLines.length === 0) {
        isParsingQuote = false;
      }
      bodyLines.push(line);
    }
  }

  // Strip leading empty lines between quote and response body
  while (bodyLines.length > 0 && bodyLines[0]?.trim() === "") {
    bodyLines.shift();
  }

  // Extract author if formatted as "@Name: snippet" or "Name: snippet"
  let quoteAuthor: string | null = null;
  let remainingQuoteText = quoteLines.join("\n");

  if (quoteLines.length > 0) {
    const firstLine = quoteLines[0] || "";
    const authorMatch = firstLine.match(/^@?([^:\n]+):\s*(.*)$/);
    if (authorMatch) {
      quoteAuthor = authorMatch[1]?.trim() ?? null;
      const restOfFirstLine = authorMatch[2] ?? "";
      remainingQuoteText =
        quoteLines.length > 1
          ? [restOfFirstLine, ...quoteLines.slice(1)].join("\n")
          : restOfFirstLine;
    }
  }

  const renderTextSegment = (text: string) => {
    const regex = /(#?[A-Z0-9_-]*LOC-[A-Z0-9_-]+|\$STR_[A-Z0-9_]+|@[a-zA-Z0-9_.-]+)/gi;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // #LOC- Narrative & Dialogue Script String Tag Match -> IDE Dotted Underline Emerald Text
      if (part.match(/^#?[A-Z0-9_-]*LOC-[A-Z0-9_-]+$/i)) {
        const cleanKey = part.replace(/^#/, "");
        const displayLabel = part.startsWith("#") ? part : `#${part}`;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelectStringKey(cleanKey)}
            className="mx-0.5 inline-flex cursor-pointer items-center rounded px-0.5 py-0 align-baseline font-mono text-[13px] font-medium tracking-tight text-emerald-400 underline decoration-dotted decoration-emerald-500/50 underline-offset-4 transition-colors hover:text-emerald-300 hover:decoration-emerald-300"
          >
            {displayLabel}
          </button>
        );
      }

      // $STR_ System, Item, & HUD Constant Tag Match -> IDE Dotted Underline Cyan Text
      if (part.match(/^\$STR_[A-Z0-9_]+$/i)) {
        const cleanKey = part.replace(/^\$/, "");
        const displayLabel = part.startsWith("$") ? part : `$${part}`;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelectStringKey(cleanKey)}
            className="mx-0.5 inline-flex cursor-pointer items-center rounded px-0.5 py-0 align-baseline font-mono text-[13px] font-medium tracking-tight text-cyan-400 underline decoration-dotted decoration-cyan-500/50 underline-offset-4 transition-colors hover:text-cyan-300 hover:decoration-cyan-300"
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
            className="mx-0.5 font-bold text-accent-gold decoration-accent-gold/70 transition-colors hover:decoration-accent-gold"
          >
            @{cleanUsername}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div>
      {quoteLines.length > 0 && (
        <div className="mb-1 rounded-r border-l-2 border-slate-500 bg-surface-card/90 px-2.5 py-1 font-sans text-xs text-slate-300">
          <div className="line-clamp-3 select-text">
            {quoteAuthor && (
              <span className="mr-1.5 font-bold text-slate-100 not-italic">{quoteAuthor}:</span>
            )}
            <span className="text-slate-300 italic">{renderTextSegment(remainingQuoteText)}</span>
          </div>
        </div>
      )}
      <div className="font-sans leading-relaxed whitespace-pre-wrap text-gray-200">
        {renderTextSegment(bodyLines.join("\n"))}
      </div>
    </div>
  );
};

/**
 * Floating hover toolbar for individual messages
 */
const MessageHoverBar: React.FC<{
  message: MessageDTO;
  onReply?: (message: MessageDTO) => void;
  onSelectStringKey?: (key: string) => void;
}> = ({ message, onReply, onSelectStringKey }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const tagMatch = message.content.match(/(#LOC-[A-Z0-9_-]+|\$STR_[A-Z0-9_]+)/i);
  const matchedKey = tagMatch ? tagMatch[0].replace(/^[#$]/, "") : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  };

  return (
    <div className="absolute -top-3.5 right-3 z-10 hidden items-center space-x-0.5 rounded-lg border border-border-subtle bg-surface-card/95 px-1 py-0.5 shadow-md backdrop-blur-md group-hover:flex">
      {onReply && (
        <button
          type="button"
          onClick={() => onReply(message)}
          className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-surface-hover hover:text-accent-gold"
          title={t("message.reply")}
        >
          <Reply className="h-3.5 w-3.5" />
        </button>
      )}

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
          className={cn(
            "cursor-pointer rounded p-1 transition-colors",
            matchedKey.startsWith("STR_")
              ? "text-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-300"
              : "text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300",
          )}
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
  channelName,
  isDm = false,
  onSelectStringKey,
  onOpenDm,
  onReply,
  inspectedStringKey,
  highlightedTagKey,
  onDismissTagHighlight,
  onReportMatchesCount,
  isSearchOpen = false,
  searchQuery = "",
  onSearchQueryChange,
  onCloseSearch,
}) => {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers, joinChannel } = useSocket();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [activeLightbox, setActiveLightbox] = useState<{
    attachment: AttachmentDTO;
    uploaderId?: string;
    uploaderName?: string;
  } | null>(null);

  // Scroll management & unread tracking:
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const isInitialLoadRef = useRef<boolean>(true);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // In-chat tag highlight & search jump navigation:
  const matchingMessageIds = useMemo(() => {
    if (isSearchOpen && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return messages
        .filter(
          (m) =>
            m.content.toLowerCase().includes(q) ||
            m.sender.displayName.toLowerCase().includes(q) ||
            m.sender.username.toLowerCase().includes(q),
        )
        .map((m) => m.id);
    }
    if (highlightedTagKey) {
      const tag = highlightedTagKey.toLowerCase().replace(/^#/, "");
      return messages.filter((m) => m.content.toLowerCase().includes(tag)).map((m) => m.id);
    }
    return [];
  }, [messages, isSearchOpen, searchQuery, highlightedTagKey]);

  const inspectedMatchesCount = useMemo(() => {
    if (!inspectedStringKey) return 0;
    const cleanKey = inspectedStringKey.toLowerCase().replace(/^#/, "");
    return messages.filter((m) => m.content.toLowerCase().includes(cleanKey)).length;
  }, [messages, inspectedStringKey]);

  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Adjust state during render when highlighted tag or search query changes:
  const [prevTagKey, setPrevTagKey] = useState(highlightedTagKey);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  if (highlightedTagKey !== prevTagKey) {
    setPrevTagKey(highlightedTagKey);
    setCurrentMatchIndex(0);
  }
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setCurrentMatchIndex(0);
  }

  const safeMatchIndex =
    matchingMessageIds.length > 0 ? Math.min(currentMatchIndex, matchingMessageIds.length - 1) : 0;

  // Auto-focus search input when search bar opens
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [isSearchOpen]);

  // Global Escape key dismisses active search
  useEffect(() => {
    if (!isSearchOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseSearch?.();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isSearchOpen, onCloseSearch]);

  // Auto-scroll to first match when tag or search results update
  useEffect(() => {
    const isTagActive = !!highlightedTagKey;
    const isSearchActive = isSearchOpen && searchQuery.trim().length > 0;

    if ((isTagActive || isSearchActive) && matchingMessageIds.length > 0 && matchingMessageIds[0]) {
      const firstId = matchingMessageIds[0];
      const timer = setTimeout(() => {
        const el = messageRefs.current[firstId];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedTagKey, isSearchOpen, searchQuery, matchingMessageIds]);

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
    const nextIdx = (safeMatchIndex + 1) % matchingMessageIds.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMatch(nextIdx);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const prevIdx = (safeMatchIndex - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(prevIdx);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCloseSearch?.();
    }
  };

  useEffect(() => {
    if (!channelId || !isConnected) return;
    joinChannel(channelId);
  }, [channelId, isConnected, joinChannel]);

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
    setIsAtBottom(atBottom);
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

  // Real-time user profile reconciliation: update sender metadata in message stream & active lightbox
  useEffect(() => {
    if (!socket) return;

    const handleUserUpdated = (updatedUser: UserProfileDTO) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender.id === updatedUser.id
            ? { ...msg, sender: { ...msg.sender, ...updatedUser } }
            : msg,
        ),
      );

      setActiveLightbox((prev) => {
        if (!prev || prev.uploaderId !== updatedUser.id) return prev;
        return { ...prev, uploaderName: updatedUser.displayName };
      });
    };

    socket.on("user_updated", handleUserUpdated);
    return () => {
      socket.off("user_updated", handleUserUpdated);
    };
  }, [socket]);

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
      {/* Floating In-Chat Message Search Jumper Controller */}
      {isSearchOpen && (
        <div className="toast-slide-in absolute top-2 left-1/2 z-30 flex -translate-x-1/2 items-center space-x-2 rounded-lg border border-border-subtle bg-surface-panel/95 px-3 py-1.5 font-sans text-xs shadow-2xl backdrop-blur-md transition-colors focus-within:border-accent-gold/50">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange?.(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t("chat.searchPlaceholder")}
            className="w-44 bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-hidden sm:w-60"
          />
          {searchQuery.trim() !== "" && (
            <span className="shrink-0 font-mono text-[11px] text-slate-400">
              {matchingMessageIds.length > 0
                ? t("chat.searchMatches", {
                    current: safeMatchIndex + 1,
                    total: matchingMessageIds.length,
                  })
                : t("chat.noSearchMatches")}
            </span>
          )}
          <div className="flex items-center space-x-0.5 border-l border-border-subtle pl-1.5">
            <button
              type="button"
              onClick={handlePrevMatch}
              disabled={matchingMessageIds.length === 0}
              className="cursor-pointer rounded p-1 text-slate-300 transition-colors hover:bg-surface-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              title="Previous match (Shift+Enter / Up)"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMatch}
              disabled={matchingMessageIds.length === 0}
              className="cursor-pointer rounded p-1 text-slate-300 transition-colors hover:bg-surface-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              title="Next match (Enter / Down)"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          {onCloseSearch && (
            <button
              type="button"
              onClick={onCloseSearch}
              className="cursor-pointer rounded border-l border-border-subtle p-1 pl-2 text-slate-400 transition-colors hover:bg-surface-hover hover:text-white"
              title={t("chat.closeSearch")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Floating Jump Controller for In-Chat Tag Mentions */}
      {!isSearchOpen && highlightedTagKey && matchingMessageIds.length > 0 && (
        <div className="toast-slide-in absolute top-2 left-1/2 z-30 flex -translate-x-1/2 items-center space-x-2.5 rounded-full border border-accent-gold/40 bg-surface-panel/95 px-3.5 py-1.5 font-sans text-xs shadow-2xl backdrop-blur-md select-none">
          <span className="font-mono text-[11px] font-bold text-accent-gold">
            #{highlightedTagKey.replace(/^#/, "")}
          </span>
          <span className="font-mono text-[11px] text-gray-300">
            {t("message.mentionsCount", {
              current: safeMatchIndex + 1,
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
          <div className="flex h-full flex-col items-center justify-center py-16 text-center font-sans select-none">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-surface-card text-accent-gold shadow-sm">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">
              {isDm
                ? t("message.welcomeDm", { name: channelName || "Colleague" })
                : t("message.welcomeChannel", { channel: channelName || channelId })}
            </h3>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-400">
              {isDm
                ? t("message.emptyDmGuide", { name: channelName || "Colleague" })
                : t("message.emptyGuideEnhanced", { channel: channelName || channelId })}
            </p>
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
            const isCurrentMatch = isMatch && matchingMessageIds[safeMatchIndex] === message.id;

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
                    message={message}
                    onReply={onReply}
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
                                        uploaderId: message.sender.id,
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

      {/* Floating Quick Scroll-to-Bottom Action Button (when scrolled away with 0 unread) */}
      {!isAtBottom && unreadCount === 0 && (
        <div className="slide-in-bottom absolute bottom-1 left-1/2 z-20 -translate-x-1/2">
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border-subtle bg-surface-card/90 text-slate-400 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:border-slate-500 hover:bg-surface-hover hover:text-slate-100 active:scale-95"
            title={t("message.scrollToLatest")}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      )}

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

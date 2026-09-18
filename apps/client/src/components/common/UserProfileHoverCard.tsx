import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, UserCheck } from "lucide-react";
import { type LocRole } from "@capsloc/types";
import { LocRoleBadge } from "../ui/LocRoleBadge";

export interface UserProfileHoverCardProps {
  user: {
    id: string;
    displayName: string;
    username: string;
    locRole?: LocRole | string | null;
    customStatus?: string | null;
    primaryLocale?: string | null;
    targetLocales?: string[] | null;
    status?: string | null;
  };
  isOnline?: boolean;
  isSelf?: boolean;
  onSendDm?: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
  side?: "top" | "bottom" | "right" | "left";
  className?: string;
}

export const UserProfileHoverCard: React.FC<UserProfileHoverCardProps> = ({
  user,
  isOnline = false,
  isSelf = false,
  onSendDm,
  children,
  align = "left",
  side = "top",
  className = "relative inline-block",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const CARD_WIDTH = 288;
    const ESTIMATED_HEIGHT = 220;
    const PADDING = 8;

    let top = 0;
    let left = 0;

    if (side === "right") {
      left = rect.right + 8;
      top = Math.max(
        PADDING,
        Math.min(rect.top, window.innerHeight - ESTIMATED_HEIGHT - PADDING),
      );
      if (left + CARD_WIDTH > window.innerWidth - PADDING) {
        left = Math.max(PADDING, rect.left - CARD_WIDTH - 8);
      }
    } else if (side === "left") {
      left = rect.left - CARD_WIDTH - 8;
      top = Math.max(
        PADDING,
        Math.min(rect.top, window.innerHeight - ESTIMATED_HEIGHT - PADDING),
      );
    } else if (side === "bottom") {
      top = rect.bottom + 8;
      left = align === "right" ? rect.right - CARD_WIDTH : rect.left;
      left = Math.max(
        PADDING,
        Math.min(left, window.innerWidth - CARD_WIDTH - PADDING),
      );
      if (top + ESTIMATED_HEIGHT > window.innerHeight - PADDING) {
        top = Math.max(PADDING, rect.top - ESTIMATED_HEIGHT - 8);
      }
    } else {
      // side === "top"
      top = rect.top - ESTIMATED_HEIGHT - 8;
      left = align === "right" ? rect.right - CARD_WIDTH : rect.left;
      left = Math.max(
        PADDING,
        Math.min(left, window.innerWidth - CARD_WIDTH - PADDING),
      );
      if (top < PADDING) {
        top = rect.bottom + 8;
      }
    }

    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleDismiss = () => setIsOpen(false);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [isOpen]);

  const initials = (user.displayName || user.username || "U")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      ref={triggerRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isOpen &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="z-[99999] w-72 rounded-xl border border-border-subtle bg-surface-panel/98 backdrop-blur-md p-3.5 shadow-2xl space-y-3 font-sans animate-in fade-in zoom-in-95 duration-150 select-none text-left"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: Avatar, Names, Presence */}
          <div className="flex items-start space-x-3">
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-lg bg-brand-navy border border-accent-gold/30 flex items-center justify-center font-mono font-bold text-accent-gold text-sm">
                {initials}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-panel ${
                  isOnline ? "bg-emerald-400" : "bg-gray-600"
                }`}
                title={isOnline ? "Online" : "Offline"}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-white truncate">
                  {user.displayName}
                </span>
                {isSelf && (
                  <span className="rounded bg-accent-gold/15 text-accent-gold font-mono font-bold text-[9px] px-1.5 py-0.2">
                    YOU
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-gray-400">
                <span className="font-mono text-gray-400">@{user.username}</span>
                <span>•</span>
                <span
                  className={`font-mono text-[10px] ${
                    isOnline ? "text-emerald-400" : "text-gray-500"
                  }`}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>

          {/* Role & Locale Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border-subtle/50">
            {user.locRole && <LocRoleBadge role={user.locRole as LocRole} />}
            {user.primaryLocale && (
              <span className="rounded bg-surface-card border border-border-subtle px-1.5 py-0.5 text-[10px] font-mono text-accent-gold">
                {user.primaryLocale}
              </span>
            )}
            {user.targetLocales && user.targetLocales.length > 0 && (
              <span className="rounded bg-surface-card border border-border-subtle px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
                &rarr; {user.targetLocales.join(", ")}
              </span>
            )}
          </div>

          {/* Custom Status Note */}
          {user.customStatus ? (
            <div className="rounded-lg bg-surface-card/60 border border-border-subtle/60 p-2 text-xs">
              <span className="text-[10px] font-mono uppercase text-gray-500 block mb-0.5">
                Status
              </span>
              <p className="italic text-gray-200 break-words font-sans">
                "{user.customStatus}"
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500 italic">
              No custom status set
            </div>
          )}

          {/* Send Message Button / Self Notice */}
          {onSendDm && !isSelf ? (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSendDm();
              }}
              className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-brand-navy hover:bg-brand-navy-light text-accent-gold border border-accent-gold/40 px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:border-accent-gold"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Send Direct Message</span>
            </button>
          ) : isSelf ? (
            <div className="flex items-center justify-center space-x-1 text-[11px] text-gray-400 py-0.5">
              <UserCheck className="h-3 w-3 text-accent-gold" />
              <span>Your profile</span>
            </div>
          ) : null}
        </div>,
        document.body,
      )}
    </div>
  );
};

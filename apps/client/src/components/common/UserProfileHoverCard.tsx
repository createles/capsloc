import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, UserCheck } from "lucide-react";
import { type LocRole } from "@capsloc/types";
import { useTranslation } from "../../i18n";
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
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
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
      top = Math.max(PADDING, Math.min(rect.top, window.innerHeight - ESTIMATED_HEIGHT - PADDING));
      if (left + CARD_WIDTH > window.innerWidth - PADDING) {
        left = Math.max(PADDING, rect.left - CARD_WIDTH - 8);
      }
    } else if (side === "left") {
      left = rect.left - CARD_WIDTH - 8;
      top = Math.max(PADDING, Math.min(rect.top, window.innerHeight - ESTIMATED_HEIGHT - PADDING));
    } else if (side === "bottom") {
      top = rect.bottom + 8;
      left = align === "right" ? rect.right - CARD_WIDTH : rect.left;
      left = Math.max(PADDING, Math.min(left, window.innerWidth - CARD_WIDTH - PADDING));
      if (top + ESTIMATED_HEIGHT > window.innerHeight - PADDING) {
        top = Math.max(PADDING, rect.top - ESTIMATED_HEIGHT - 8);
      }
    } else {
      // side === "top"
      top = rect.top - ESTIMATED_HEIGHT - 8;
      left = align === "right" ? rect.right - CARD_WIDTH : rect.left;
      left = Math.max(PADDING, Math.min(left, window.innerWidth - CARD_WIDTH - PADDING));
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

  const initials = (user.displayName || user.username || "U").substring(0, 2).toUpperCase();

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
            className="popover-scale-in z-[99999] w-72 space-y-3.5 rounded-2xl border border-white/[0.08] bg-surface-panel/95 p-4 text-left font-sans shadow-2xl shadow-black/80 backdrop-blur-xl select-none"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Avatar, Names, Presence */}
            <div className="flex items-start space-x-3">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-gold/40 bg-brand-navy font-mono text-sm font-bold text-accent-gold shadow-inner">
                  {initials}
                </div>
                <span
                  className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface-panel ${
                    isOnline ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-600"
                  }`}
                  title={isOnline ? t("sidebar.online") : t("sidebar.offline")}
                />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="truncate text-sm font-bold text-white">{user.displayName}</span>
                  {isSelf && (
                    <span className="rounded-md border border-accent-gold/30 bg-accent-gold/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-accent-gold">
                      {t("members.you")}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <span className="font-mono text-slate-400">@{user.username}</span>
                  <span>•</span>
                  <span
                    className={`font-mono text-[10px] ${
                      isOnline ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {isOnline ? t("sidebar.online") : t("sidebar.offline")}
                  </span>
                </div>
              </div>
            </div>

            {/* Role & Locale Badges */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.08] pt-2">
              {user.locRole && <LocRoleBadge role={user.locRole as LocRole} />}
              {user.primaryLocale && (
                <span className="rounded-md border border-white/[0.08] bg-surface-card/80 px-1.5 py-0.5 font-mono text-[10px] text-accent-gold">
                  {user.primaryLocale}
                </span>
              )}
              {user.targetLocales && user.targetLocales.length > 0 && (
                <span className="rounded-md border border-white/[0.08] bg-surface-card/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  &rarr; {user.targetLocales.join(", ")}
                </span>
              )}
            </div>

            {/* Custom Status Note */}
            {user.customStatus && (
              <div className="rounded-xl border border-white/[0.06] bg-surface-card/70 p-2.5 text-xs">
                <span className="mb-0.5 block font-mono text-[10px] text-slate-400 uppercase">
                  {t("hoverCard.status")}
                </span>
                <p className="font-sans break-words text-slate-200 italic">"{user.customStatus}"</p>
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
                className="flex w-full cursor-pointer items-center justify-center space-x-1.5 rounded-lg border border-accent-gold/50 bg-accent-gold/10 px-3 py-2 font-mono text-xs font-semibold text-accent-gold shadow-sm shadow-accent-gold/10 transition-all duration-150 hover:bg-accent-gold hover:text-surface-canvas active:scale-[0.98]"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{t("hoverCard.sendDm")}</span>
              </button>
            ) : isSelf ? (
              <div className="flex items-center justify-center space-x-1 py-0.5 text-[11px] text-slate-400">
                <UserCheck className="h-3.5 w-3.5 text-accent-gold" />
                <span>{t("hoverCard.yourProfile")}</span>
              </div>
            ) : null}
          </div>,
          document.body,
        )}
    </div>
  );
};

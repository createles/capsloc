import React from "react";
import { AtSign, X, ArrowRight } from "lucide-react";
import type { UserMentionedPayload } from "@capsloc/types";

export interface MentionToastProps {
  toast: UserMentionedPayload | null;
  onDismiss: () => void;
  onJumpToChannel: (channelId: string) => void;
}

export const MentionToast: React.FC<MentionToastProps> = ({
  toast,
  onDismiss,
  onJumpToChannel,
}) => {
  if (!toast) return null;

  return (
    <aside
      aria-label="Direct mention notification"
      className="fixed top-14 right-4 z-50 w-84 rounded-xl border border-accent-gold/40 bg-surface-panel/95 backdrop-blur-md p-3.5 shadow-2xl shadow-accent-gold/10 font-sans animate-in slide-in-from-top-3 duration-200 select-none"
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle/70">
        <div className="flex items-center space-x-1.5 text-accent-gold">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-accent-gold/15 border border-accent-gold/30">
            <AtSign className="h-3 w-3" />
          </div>
          <span className="font-mono text-[11px] font-bold tracking-wide uppercase">
            Tagged in #{toast.channelName || "channel"}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
          title="Dismiss Alert"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message Info */}
      <div className="py-2.5 space-y-1">
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-white">
            {toast.senderName}
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            mentioned you
          </span>
        </div>
        <p className="text-xs text-gray-300 line-clamp-2 italic font-mono bg-surface-card/60 p-2 rounded border border-border-subtle/50">
          "{toast.message.content}"
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={() => {
            onJumpToChannel(toast.channelId);
            onDismiss();
          }}
          className="flex items-center space-x-1.5 rounded-md bg-accent-gold hover:bg-accent-gold/90 text-brand-navy px-2.5 py-1 text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <span>View Mention</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </aside>
  );
};

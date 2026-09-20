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
      className="animate-in slide-in-from-top-3 fixed top-14 right-4 z-50 w-84 rounded-2xl border border-accent-gold/40 bg-surface-panel/95 p-4 font-sans shadow-2xl shadow-accent-gold/10 backdrop-blur-xl duration-200 select-none"
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <div className="flex items-center space-x-2 text-accent-gold">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-accent-gold/30 bg-accent-gold/15 shadow-inner">
            <AtSign className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-[11px] font-bold tracking-wide uppercase">
            Tagged in #{toast.channelName || "channel"}
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="cursor-pointer rounded-lg p-1 text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white"
          title="Dismiss Alert"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message Info */}
      <div className="space-y-1.5 py-3">
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-white">{toast.senderName}</span>
          <span className="font-mono text-[10px] text-slate-400">mentioned you</span>
        </div>
        <p className="line-clamp-2 rounded-xl border border-white/[0.06] bg-surface-card/80 p-2.5 font-mono text-xs text-slate-300 italic">
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
          className="hover:bg-accent-gold-light flex cursor-pointer items-center space-x-1.5 rounded-lg bg-accent-gold px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-surface-canvas uppercase shadow-sm shadow-accent-gold/20 transition-all duration-150 active:scale-[0.98]"
        >
          <span>View Mention</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
};

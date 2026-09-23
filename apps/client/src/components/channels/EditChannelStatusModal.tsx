import React, { useState } from "react";
import { X, Pin, Loader2, Trash2 } from "lucide-react";
import type { ChannelDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useTranslation } from "../../i18n";

export interface EditChannelStatusModalProps {
  channel: ChannelDTO;
  onClose: () => void;
  onUpdated: (updatedChannel: ChannelDTO) => void;
}

export const EditChannelStatusModal: React.FC<EditChannelStatusModalProps> = ({
  channel,
  onClose,
  onUpdated,
}) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string>(channel.status || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.patch<ChannelDTO>(`/channels/${channel.id}`, {
        status: status.trim() || null,
      });
      onUpdated(response.data);
      onClose();
    } catch (err: any) {
      console.error("Failed to update channel sprint status:", err);
      setError(
        err.response?.data?.message || "Failed to update sprint status. Verify admin permissions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearStatus = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.patch<ChannelDTO>(`/channels/${channel.id}`, {
        status: null,
      });
      onUpdated(response.data);
      onClose();
    } catch (err: any) {
      console.error("Failed to clear channel sprint status:", err);
      setError(
        err.response?.data?.message || "Failed to clear sprint status. Verify admin permissions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop-animate fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md select-none">
      <div
        className="modal-card-animate w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-panel shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-surface-card/50 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 shadow-inner">
              <Pin className="h-4 w-4 text-accent-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{t("editStatus.title")}</h3>
              <p className="font-mono text-[11px] text-slate-400">#{channel.name || "channel"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5 p-6 text-xs">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Sprint Status Input */}
          <div>
            <label className="mb-1.5 flex items-center justify-between font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
              <span>{t("editStatus.sprintStatus")}</span>
              <span className="font-mono text-[10px] text-slate-500">{status.length}/100</span>
            </label>
            <div className="relative">
              <Pin className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-accent-gold" />
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="e.g. Last 2 weeks until 9/20/26 deadline"
                maxLength={100}
                className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-8 pl-8 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
              />
              {status && (
                <button
                  type="button"
                  onClick={() => setStatus("")}
                  className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white"
                  title="Clear field"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mt-1.5 font-mono text-[10px] text-slate-400">
              {t("editStatus.bannerNotice")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
            {channel.status ? (
              <button
                type="button"
                onClick={handleClearStatus}
                disabled={isSubmitting}
                className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 transition-all hover:bg-rose-500/20 hover:text-rose-300 active:scale-[0.98] disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t("editStatus.clearStatus")}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
              >
                {t("editStatus.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-accent-gold/50 bg-accent-gold/10 px-4 py-2 font-mono text-xs font-bold tracking-wider text-accent-gold uppercase shadow-sm shadow-accent-gold/10 transition-all duration-150 hover:bg-accent-gold hover:text-surface-canvas active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{t("editStatus.saveStatus")}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

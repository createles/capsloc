import React, { useState } from "react";
import { X, Pin, Loader2, Trash2 } from "lucide-react";
import type { ChannelDTO } from "@capsloc/types";
import { api } from "../../services/api";

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
  const [status, setStatus] = useState<string>(channel.status || "");
  const [description, setDescription] = useState<string>(channel.description || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.patch<ChannelDTO>(`/channels/${channel.id}`, {
        status: status.trim() || null,
        description: description.trim() || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface-panel shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-card/60 px-5 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Pin className="h-4 w-4 text-accent-gold" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Edit Channel Sprint Status</h3>
              <p className="text-[11px] font-mono text-gray-400">#{channel.name || "channel"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-400 text-[11px]">
              {error}
            </div>
          )}

          {/* Sprint Status Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-gray-300 flex items-center justify-between">
              <span>Sprint Status / Pinned Milestone</span>
              <span className="text-[10px] font-mono text-gray-500">{status.length}/100</span>
            </label>
            <div className="relative">
              <Pin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-accent-gold" />
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="e.g. Last 2 weeks until 9/20/26 deadline"
                maxLength={100}
                className="w-full rounded-md border border-border-subtle bg-surface-card pl-8 pr-8 py-2 text-white placeholder-gray-500 focus:border-accent-gold/50 focus:outline-none"
              />
              {status && (
                <button
                  type="button"
                  onClick={() => setStatus("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                  title="Clear field"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              Displayed as a pinned rectangular banner across the top of the chat stream.
            </p>
          </div>

          {/* Description Input */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-medium text-gray-300 flex items-center justify-between">
              <span>Channel Description</span>
              <span className="text-[10px] font-mono text-gray-500">{description.length}/250</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Channel purpose and localization scope..."
              maxLength={250}
              rows={2}
              className="w-full rounded-md border border-border-subtle bg-surface-card px-3 py-2 text-white placeholder-gray-500 focus:border-accent-gold/50 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            {channel.status ? (
              <button
                type="button"
                onClick={handleClearStatus}
                disabled={isSubmitting}
                className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1.5 rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Status</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 rounded-md bg-brand-navy hover:bg-brand-navy-light px-4 py-1.5 text-xs font-semibold text-accent-gold border border-accent-gold/40 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Status</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { X, Hash, Loader2, Lock, Globe } from "lucide-react";
import { ChannelType, type ChannelDTO } from "@capsloc/types";
import { api } from "../../services/api";

export interface CreateChannelModalProps {
  onClose: () => void;
  onChannelCreated: (channel: ChannelDTO) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  onClose,
  onChannelCreated,
}) => {
  const [name, setName] = useState("");
  const [projectTag, setProjectTag] = useState("MH-WILDS");
  const [localeTag, setLocaleTag] = useState("JA->EN");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ChannelType>(ChannelType.PUBLIC_PROJECT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!cleanName) {
      setError("Channel name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post<ChannelDTO>("/channels", {
        name: cleanName,
        projectTag: projectTag.trim().toUpperCase() || undefined,
        localeTag: localeTag.trim().toUpperCase() || undefined,
        description: description.trim() || undefined,
        type,
      });

      onChannelCreated(data);
      onClose();
    } catch (err: any) {
      console.error("Failed to create channel:", err);
      setError(err.response?.data?.message || "Failed to create channel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border-subtle bg-surface-panel shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4 bg-surface-card/40">
          <div className="flex items-center space-x-2">
            <Hash className="h-4 w-4 text-accent-gold" />
            <span className="font-semibold text-sm text-white">Create Channel</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-400 text-[11px]">
              {error}
            </div>
          )}

          {/* Channel Name */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-300">Channel Name</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-500 font-mono">#</span>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. loc-dialogue-review"
                required
                className="w-full rounded-md border border-border-subtle bg-surface-card pl-7 pr-3 py-2 text-white placeholder-gray-500
  focus:border-accent-gold/50 focus:outline-none font-mono text-xs"
              />
            </div>
          </div>

          {/* Project Tag & Locale Tag Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-gray-300">Project Tag</label>
              <input
                type="text"
                value={projectTag}
                onChange={(e) => setProjectTag(e.target.value)}
                placeholder="e.g. MH-WILDS"
                className="w-full rounded-md border border-border-subtle bg-surface-card px-3 py-2 text-white placeholder-gray-500
  focus:border-accent-gold/50 focus:outline-none font-mono text-xs uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-gray-300">Locale Tag</label>
              <input
                type="text"
                value={localeTag}
                onChange={(e) => setLocaleTag(e.target.value)}
                placeholder="e.g. JA->EN"
                className="w-full rounded-md border border-border-subtle bg-surface-card px-3 py-2 text-white placeholder-gray-500
  focus:border-accent-gold/50 focus:outline-none font-mono text-xs uppercase"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-300">
              Description <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel for?"
              className="w-full rounded-md border border-border-subtle bg-surface-card px-3 py-2 text-white placeholder-gray-500
  focus:border-accent-gold/50 focus:outline-none text-xs"
            />
          </div>

          {/* Visibility Type Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-gray-300">
              Channel Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType(ChannelType.PUBLIC_PROJECT)}
                className={`flex items-center space-x-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                  type === ChannelType.PUBLIC_PROJECT
                    ? "border-accent-gold/50 bg-brand-navy/60 text-white"
                    : "border-border-subtle bg-surface-card text-gray-400 hover:text-gray-200"
                }`}
              >
                <Globe className="h-4 w-4 text-accent-gold shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-white">Public</div>
                  <div className="text-[10px] text-gray-400">Open to all team members</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType(ChannelType.PRIVATE_LOCALE)}
                className={`flex items-center space-x-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                  type === ChannelType.PRIVATE_LOCALE
                    ? "border-accent-gold/50 bg-brand-navy/60 text-white"
                    : "border-border-subtle bg-surface-card text-gray-400 hover:text-gray-200"
                }`}
              >
                <Lock className="h-4 w-4 text-accent-gold shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-white">Private</div>
                  <div className="text-[10px] text-gray-400">Restricted locale team</div>
                </div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center space-x-1.5 rounded-md bg-brand-navy hover:bg-brand-navy-light px-4 py-1.5 text-xs font-semibold
  text-accent-gold border border-accent-gold/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Create Channel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

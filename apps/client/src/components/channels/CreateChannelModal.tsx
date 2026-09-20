import React, { useState, useEffect } from "react";
import { X, Hash, Loader2, Lock, Globe } from "lucide-react";
import { ChannelType, type ChannelDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useTranslation } from "../../i18n";

export interface CreateChannelModalProps {
  onClose: () => void;
  onChannelCreated: (channel: ChannelDTO) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  onClose,
  onChannelCreated,
}) => {
  const { t } = useTranslation();
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
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-panel shadow-2xl shadow-black/80 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-surface-card/50 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent-gold/40 bg-brand-navy shadow-inner">
              <Hash className="h-4 w-4 text-accent-gold" />
            </div>
            <span className="text-sm font-semibold text-white">{t("createChannel.title")}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4.5 p-6 text-xs">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Channel Name */}
          <div>
            <label className="mb-1.5 block font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
              {t("createChannel.channelName")}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 font-mono text-slate-500">#</span>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. loc-dialogue-review"
                required
                className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-3 pl-7 font-mono text-xs text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Project Tag & Locale Tag Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
                {t("createChannel.projectTag")}
              </label>
              <input
                type="text"
                value={projectTag}
                onChange={(e) => setProjectTag(e.target.value)}
                placeholder="e.g. MH-WILDS"
                className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 px-3 py-2 font-mono text-xs text-white uppercase placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
                {t("createChannel.localeTag")}
              </label>
              <input
                type="text"
                value={localeTag}
                onChange={(e) => setLocaleTag(e.target.value)}
                placeholder="e.g. JA->EN"
                className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 px-3 py-2 font-mono text-xs text-white uppercase placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
              {t("createChannel.description")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("createChannel.descriptionPlaceholder")}
              className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 px-3 py-2 text-xs text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
            />
          </div>

          {/* Visibility Type Selector */}
          <div>
            <label className="mb-1.5 block font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
              {t("createChannel.visibility")}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType(ChannelType.PUBLIC_PROJECT)}
                className={`flex cursor-pointer items-center space-x-2.5 rounded-xl border p-3 text-left transition-all ${
                  type === ChannelType.PUBLIC_PROJECT
                    ? "border-accent-gold/50 bg-brand-navy/80 text-white shadow-sm ring-1 ring-accent-gold/20"
                    : "border-white/[0.08] bg-surface-card/60 text-slate-400 hover:border-white/[0.12] hover:bg-surface-card hover:text-slate-200"
                }`}
              >
                <Globe className="h-4 w-4 shrink-0 text-accent-gold" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    {t("createChannel.public")}
                  </div>
                  <div className="text-[10px] text-slate-400">{t("createChannel.publicHelp")}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType(ChannelType.PRIVATE_LOCALE)}
                className={`flex cursor-pointer items-center space-x-2.5 rounded-xl border p-3 text-left transition-all ${
                  type === ChannelType.PRIVATE_LOCALE
                    ? "border-accent-gold/50 bg-brand-navy/80 text-white shadow-sm ring-1 ring-accent-gold/20"
                    : "border-white/[0.08] bg-surface-card/60 text-slate-400 hover:border-white/[0.12] hover:bg-surface-card hover:text-slate-200"
                }`}
              >
                <Lock className="h-4 w-4 shrink-0 text-accent-gold" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    {t("createChannel.private")}
                  </div>
                  <div className="text-[10px] text-slate-400">{t("createChannel.privateHelp")}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2.5 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
            >
              {t("createChannel.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-accent-gold/50 bg-accent-gold/10 px-4 py-2 font-mono text-xs font-bold tracking-wider text-accent-gold uppercase shadow-sm shadow-accent-gold/10 transition-all duration-150 hover:bg-accent-gold hover:text-surface-canvas active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{t("createChannel.submit")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

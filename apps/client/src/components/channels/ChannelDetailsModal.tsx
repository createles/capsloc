import React, { useState } from "react";
import { X, Hash, Lock, Globe, Tag, Calendar, User, Pencil, Loader2, Check } from "lucide-react";
import { ChannelType, type ChannelDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useTranslation } from "../../i18n";

export interface ChannelDetailsModalProps {
  channel: ChannelDTO;
  isChannelAdmin: boolean;
  onClose: () => void;
  onUpdated: (updatedChannel: ChannelDTO) => void;
}

export const ChannelDetailsModal: React.FC<ChannelDetailsModalProps> = ({
  channel,
  isChannelAdmin,
  onClose,
  onUpdated,
}) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState<string>(channel.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isPrivate = channel.type === ChannelType.PRIVATE_LOCALE;

  const creatorMember = channel.members?.find((m) => m.userId === channel.createdById);
  const creatorName =
    creatorMember?.user?.displayName ||
    creatorMember?.user?.username ||
    (channel.createdById ? t("channelDetails.unknownUser") : t("channelDetails.system"));

  const formattedCreatedDate = channel.createdAt
    ? new Date(channel.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const handleSaveDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.patch<ChannelDTO>(`/channels/${channel.id}`, {
        description: description.trim() || null,
      });
      onUpdated(response.data);
      setIsEditingDesc(false);
    } catch (err: any) {
      console.error("Failed to update channel description:", err);
      setError(
        err.response?.data?.message || "Failed to update channel description. Verify permissions.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setDescription(channel.description || "");
    setIsEditingDesc(false);
    setError(null);
  };

  return (
    <div
      className="modal-backdrop-animate fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md select-none"
      onClick={onClose}
    >
      <div
        className="modal-card-animate w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-panel shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-surface-card/50 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-gold/30 bg-brand-navy font-mono text-sm font-bold text-accent-gold shadow-inner">
              {isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">#{channel.name}</h3>
                <span
                  className={`py-0.2 rounded border px-1.5 font-mono text-[9px] uppercase ${
                    isPrivate
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-blue-500/30 bg-blue-500/10 text-blue-300"
                  }`}
                >
                  {isPrivate
                    ? t("channelDetails.privateLocale")
                    : t("channelDetails.publicProject")}
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-400">
                {t("channelDetails.membersCount", { count: channel.members?.length || 0 })}
              </p>
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

        {/* Content */}
        <div className="space-y-4.5 p-6 text-xs select-text">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          {/* Description Section */}
          <div className="rounded-xl border border-white/[0.08] bg-surface-card/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase">
                {t("channelDetails.description")}
              </span>
              {isChannelAdmin && !isEditingDesc && (
                <button
                  type="button"
                  onClick={() => setIsEditingDesc(true)}
                  className="hover:text-accent-gold-light flex cursor-pointer items-center space-x-1 font-mono text-[11px] text-accent-gold transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  <span>{t("channelDetails.editDescription")}</span>
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <form onSubmit={handleSaveDescription} className="space-y-3">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("channelDetails.descPlaceholder")}
                  maxLength={250}
                  rows={3}
                  className="focus:bg-surface-elevated w-full resize-none rounded-lg border border-white/[0.08] bg-surface-card/90 px-3 py-2 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
                />
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>{description.length}/250</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                    >
                      {t("channelDetails.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-accent-gold/50 bg-accent-gold/10 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-accent-gold uppercase transition-all hover:bg-accent-gold hover:text-surface-canvas disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      <span>{t("channelDetails.saveChanges")}</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <p
                className={`text-xs leading-relaxed ${
                  channel.description ? "text-slate-200" : "text-slate-500 italic"
                }`}
              >
                {channel.description || t("channelDetails.noDescription")}
              </p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            {/* Project Tag */}
            {channel.projectTag && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-white/[0.06] bg-surface-card/40 p-3">
                <Tag className="h-3.5 w-3.5 shrink-0 text-accent-gold" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 uppercase">
                    {t("channelDetails.projectTag")}
                  </div>
                  <div className="truncate font-semibold text-white">{channel.projectTag}</div>
                </div>
              </div>
            )}

            {/* Locale Tag */}
            {channel.localeTag && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-white/[0.06] bg-surface-card/40 p-3">
                <Globe className="h-3.5 w-3.5 shrink-0 text-accent-gold" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 uppercase">
                    {t("channelDetails.localeTag")}
                  </div>
                  <div className="truncate font-semibold text-white">{channel.localeTag}</div>
                </div>
              </div>
            )}

            {/* Creator */}
            <div className="flex items-center space-x-2.5 rounded-xl border border-white/[0.06] bg-surface-card/40 p-3">
              <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 uppercase">
                  {t("channelDetails.createdBy")}
                </div>
                <div className="truncate font-semibold text-white">{creatorName}</div>
              </div>
            </div>

            {/* Created Date */}
            {formattedCreatedDate && (
              <div className="flex items-center space-x-2.5 rounded-xl border border-white/[0.06] bg-surface-card/40 p-3">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-500 uppercase">
                    {t("channelDetails.createdOnLabel")}
                  </div>
                  <div className="truncate font-semibold text-white">{formattedCreatedDate}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-white/[0.08] bg-surface-card/30 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 font-mono text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
          >
            {t("channelDetails.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

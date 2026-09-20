import React, { useState, useEffect } from "react";
import { X, User, Loader2, Smile, ChevronDown } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../i18n";
import { LocRoleBadge } from "../ui/LocRoleBadge";

export interface UserProfileModalProps {
  onClose: () => void;
}

const STATUS_PRESETS = [
  { emoji: "☕", key: "status.onBreak" },
  { emoji: "🎮", key: "status.lqaTesting" },
  { emoji: "💬", key: "status.focusMode" },
  { emoji: "🍕", key: "status.lunchBreak" },
  { emoji: "⛔", key: "status.away" },
  { emoji: "💼", key: "status.inMeeting" },
] as const;

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [customStatus, setCustomStatus] = useState(user?.customStatus || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [primaryLocale, setPrimaryLocale] = useState(user?.primaryLocale || "en-US");
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
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateProfile({
        displayName: displayName.trim(),
        customStatus: customStatus.trim() || null,
        bio: bio.trim() || null,
        primaryLocale,
      });
      onClose();
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to save changes. Please try again.");
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
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-accent-gold" />
            <span className="text-sm font-semibold text-white">{t("profile.editProfile")}</span>
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

          {/* User Avatar Card Preview */}
          {user && (
            <div className="flex items-center space-x-3 rounded-xl border border-white/[0.08] bg-surface-card/70 p-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent-gold/40 bg-brand-navy font-mono text-sm font-bold text-accent-gold shadow-inner">
                {user.displayName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="truncate font-semibold text-white">{user.displayName}</span>
                  <LocRoleBadge role={user.locRole} />
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-slate-400">@{user.username}</div>
              </div>
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="mb-1.5 block font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
              {t("profile.displayName")}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required
              className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 px-3 py-2 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
            />
          </div>

          {/* Custom Status with Presets */}
          <div>
            <label className="mb-1.5 flex items-center justify-between font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
              <span>{t("profile.customStatus")}</span>
              <span className="font-mono text-[10px] text-slate-500">
                {customStatus.length}/100
              </span>
            </label>
            <div className="relative">
              <Smile className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder={t("profile.statusPlaceholder")}
                maxLength={100}
                className="focus:bg-surface-elevated w-full rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-8 pl-8 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
              />
              {customStatus && (
                <button
                  type="button"
                  onClick={() => setCustomStatus("")}
                  className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Preset Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {STATUS_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setCustomStatus(`${preset.emoji} ${t(preset.key)}`)}
                  className="inline-flex cursor-pointer items-center space-x-1.5 rounded-full border border-white/[0.08] bg-surface-card/90 px-2.5 py-1 text-[11px] text-slate-300 transition-all hover:border-accent-gold/40 hover:bg-white/[0.06] hover:text-white active:scale-95"
                >
                  <span>{preset.emoji}</span>
                  <span>{t(preset.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1.5 block font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
              {t("profile.bio")}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profile.bioPlaceholder")}
              maxLength={250}
              rows={2}
              className="focus:bg-surface-elevated w-full resize-none rounded-lg border border-white/[0.08] bg-surface-card/90 px-3 py-2 text-white placeholder-slate-500 transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
            />
          </div>

          {/* Primary Locale */}
          <div>
            <label className="mb-1.5 block font-mono text-xs font-medium tracking-wider text-slate-400 uppercase">
              {t("profile.primaryLocale")}
            </label>
            <div className="relative">
              <select
                value={primaryLocale}
                onChange={(e) => setPrimaryLocale(e.target.value)}
                className="focus:bg-surface-elevated w-full cursor-pointer appearance-none rounded-lg border border-white/[0.08] bg-surface-card/90 py-2 pr-10 pl-3 text-white transition-all focus:border-accent-gold/60 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
              >
                <option value="en-US">English (en-US)</option>
                <option value="ja-JP">Japanese (ja-JP)</option>
                <option value="de-DE">German (de-DE)</option>
                <option value="fr-FR">French (fr-FR)</option>
                <option value="es-ES">Spanish (es-ES)</option>
                <option value="it-IT">Italian (it-IT)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2.5 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
            >
              {t("profile.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-accent-gold/50 bg-accent-gold/10 px-4 py-2 font-mono text-xs font-bold tracking-wider text-accent-gold uppercase shadow-sm shadow-accent-gold/10 transition-all duration-150 hover:bg-accent-gold hover:text-surface-canvas active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{t("profile.saveChanges")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

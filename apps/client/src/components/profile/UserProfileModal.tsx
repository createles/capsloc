import React, { useState, useEffect } from "react";
import { X, User, Loader2, Smile } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LocRoleBadge } from "../ui/LocRoleBadge";

export interface UserProfileModalProps {
  onClose: () => void;
}

const STATUS_PRESETS = [
  { emoji: "☕", text: "On Break" },
  { emoji: "🎮", text: "LQA Testing" },
  { emoji: "💬", text: "Focus Mode" },
  { emoji: "🍕", text: "Lunch Break" },
  { emoji: "⛔", text: "Away" },
  { emoji: "💼", text: "In a Meeting" },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  onClose,
}) => {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [customStatus, setCustomStatus] = useState(user?.customStatus || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [primaryLocale, setPrimaryLocale] = useState(
    user?.primaryLocale || "en-US",
  );
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
            <User className="h-4 w-4 text-accent-gold" />
            <span className="font-semibold text-sm text-white">
              Edit Profile
            </span>
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

          {/* User Avatar Card Preview */}
          {user && (
            <div className="flex items-center space-x-3 rounded-lg border border-border-subtle bg-surface-card p-3">
              <div
                className="h-10 w-10 rounded-lg bg-brand-navy border border-accent-gold/30 flex items-center justify-center font-mono
  font-bold text-accent-gold text-sm shrink-0"
              >
                {user.displayName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                {/* Name and Role Badge on same line */}
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white truncate">
                    {user.displayName}
                  </span>
                  <LocRoleBadge role={user.locRole} />
                </div>
                {/* Username directly below */}
                <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                  @{user.username}
                </div>
              </div>
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-300">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required
              className="w-full rounded-md border border-border-subtle bg-surface-card px-3 py-2 text-white placeholder-gray-500
  focus:border-accent-gold/50 focus:outline-none"
            />
          </div>

          {/* Custom Status with Presets */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-gray-300 flex items-center justify-between">
              <span>Custom Status</span>
              <span className="text-[10px] font-mono text-gray-500">
                {customStatus.length}/100
              </span>
            </label>
            <div className="relative">
              <Smile className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="What are you working on? (e.g. Updating Resident Evil Requiem UI strings)"
                maxLength={100}
                className="w-full rounded-md border border-border-subtle bg-surface-card pl-8 pr-8 py-2 text-white placeholder-gray-500
  focus:border-accent-gold/50 focus:outline-none"
              />
              {customStatus && (
                <button
                  type="button"
                  onClick={() => setCustomStatus("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Preset Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {STATUS_PRESETS.map((preset) => (
                <button
                  key={preset.text}
                  type="button"
                  onClick={() =>
                    setCustomStatus(`${preset.emoji} ${preset.text}`)
                  }
                  className="inline-flex items-center space-x-1 rounded-full border border-border-subtle bg-surface-card/80 hover:bg-surface-
  hover px-2.5 py-1 text-[11px] text-gray-300 transition-colors cursor-pointer"
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-300">
              Bio / Specialization
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Lead Japanese to English translator on Monster Hunter series."
              maxLength={250}
              rows={2}
              className="w-full rounded-md border border-border-subtle bg-surface-card px-3 py-2 text-white placeholder-gray-500
  focus:border-accent-gold/50 focus:outline-none resize-none"
            />
          </div>

          {/* Primary Locale */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-300">
              Primary Locale
            </label>
            <select
              value={primaryLocale}
              onChange={(e) => setPrimaryLocale(e.target.value)}
              className="w-full rounded-md border border-border-subtle bg-surface-card px-3 py-2 text-white focus:border-accent-gold/50
  focus:outline-none"
            >
              <option value="en-US">English (en-US)</option>
              <option value="ja-JP">Japanese (ja-JP)</option>
              <option value="de-DE">German (de-DE)</option>
              <option value="fr-FR">French (fr-FR)</option>
              <option value="es-ES">Spanish (es-ES)</option>
              <option value="it-IT">Italian (it-IT)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-
  pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 rounded-md bg-brand-navy hover:bg-brand-navy-light px-4 py-1.5 text-xs font-semibold
  text-accent-gold border border-accent-gold/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import { Tag, Check } from "lucide-react";

import { useTranslation } from "../../i18n";
import { ATTACHMENT_TAG_PRESETS } from "@capsloc/types";

export interface AttachmentTagPickerProps {
  currentTag?: string | null;
  channelLocaleTag?: string | null;
  onSelectTag: (newTag: string | null) => void;
  onClose: () => void;
}

export const AttachmentTagPicker: React.FC<AttachmentTagPickerProps> = ({
  currentTag,
  channelLocaleTag,
  onSelectTag,
  onClose,
}) => {
  const { t } = useTranslation();
  const [customInput, setCustomInput] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Group presets into LQA defects and Reference categories
  const lqaPresets = ATTACHMENT_TAG_PRESETS.slice(0, 5); // UI-OVERFLOW, FONT-ISSUE, LINE-BREAK, AUDIO-DESYNC, UNTRANSLATED
  const refPresets = ATTACHMENT_TAG_PRESETS.slice(5); // JA-REF, EN-BASE, DEV-NOTE, GLOSSARY-REF

  // Derive dynamic channel preset if active channel has a localeTag
  const channelPreset = channelLocaleTag
    ? `${channelLocaleTag.replace("->", "-").toUpperCase()}-REF`
    : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim().toUpperCase().replace(/\s+/g, "-");
    if (trimmed) {
      onSelectTag(trimmed);
      onClose();
    }
  };

  return (
    <div
      ref={popoverRef}
      className="animate-in fade-in zoom-in-95 absolute bottom-full left-0 z-30 mb-2 w-72 rounded-lg border border-border-subtle bg-surface-card p-3 shadow-2xl backdrop-blur-md duration-100"
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-border-subtle pb-1.5 font-sans text-xs text-slate-300">
        <div className="flex items-center space-x-1.5">
          <Tag className="h-3.5 w-3.5 text-accent-gold" />
          <span className="font-semibold text-white">{t("composer.tagPopoverTitle")}</span>
        </div>
        {currentTag && (
          <button
            type="button"
            onClick={() => {
              onSelectTag(null);
              onClose();
            }}
            className="cursor-pointer font-mono text-[10px] text-gray-400 transition-colors hover:text-status-flagged"
          >
            {t("composer.clearTag")}
          </button>
        )}
      </div>

      {/* Custom Tag Input */}
      <form onSubmit={handleApplyCustom} className="mb-2.5 flex items-center space-x-1">
        <input
          ref={inputRef}
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={t("composer.customTagPlaceholder")}
          maxLength={30}
          className="flex-1 rounded border border-border-subtle bg-surface-panel px-2 py-1 font-mono text-[11px] text-white placeholder-gray-500 focus:border-accent-gold/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!customInput.trim()}
          className="cursor-pointer rounded border border-accent-gold/40 bg-brand-navy px-2 py-1 font-mono text-[11px] text-accent-gold transition-colors hover:bg-brand-navy/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* LQA Presets */}
      <div className="mb-2">
        <div className="mb-1 font-mono text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
          {t("composer.tagPresetsLqa")}
        </div>
        <div className="flex flex-wrap gap-1">
          {lqaPresets.map((preset) => {
            const isSelected = currentTag === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onSelectTag(preset);
                  onClose();
                }}
                className={`cursor-pointer rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                  isSelected
                    ? "border-accent-gold bg-accent-gold/20 font-bold text-accent-gold"
                    : "border-border-subtle bg-surface-panel text-slate-300 hover:border-accent-gold/40 hover:text-white"
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reference & Context Presets */}
      <div className="mb-2">
        <div className="mb-1 font-mono text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
          {t("composer.tagPresetsRef")}
        </div>
        <div className="flex flex-wrap gap-1">
          {refPresets.map((preset) => {
            const isSelected = currentTag === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  onSelectTag(preset);
                  onClose();
                }}
                className={`cursor-pointer rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                  isSelected
                    ? "border-accent-gold bg-accent-gold/20 font-bold text-accent-gold"
                    : "border-border-subtle bg-surface-panel text-slate-300 hover:border-accent-gold/40 hover:text-white"
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel Preset (if applicable) */}
      {channelPreset && (
        <div>
          <div className="mb-1 font-mono text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            {t("composer.tagPresetsChannel")}
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => {
                onSelectTag(channelPreset);
                onClose();
              }}
              className={`cursor-pointer rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                currentTag === channelPreset
                  ? "border-accent-gold bg-accent-gold/20 font-bold text-accent-gold"
                  : "border-border-subtle bg-surface-panel text-slate-300 hover:border-accent-gold/40 hover:text-white"
              }`}
            >
              {channelPreset}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

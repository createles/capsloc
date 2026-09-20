import React from "react";
import { useTranslation } from "../../i18n";

export const LanguageToggle: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      role="group"
      aria-label="UI Language Toggle"
      className="inline-flex items-center rounded-lg border border-border-subtle bg-surface-card/60 p-0.5 font-mono text-[11px] select-none"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`cursor-pointer rounded-md border px-2 py-0.5 font-semibold transition-colors duration-150 ${
          locale === "en"
            ? "border-accent-gold/40 bg-brand-navy text-accent-gold shadow-xs"
            : "border-transparent text-slate-400 hover:text-slate-200"
        }`}
        aria-label="Switch UI language to English"
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("ja")}
        className={`cursor-pointer rounded-md border px-2 py-0.5 font-semibold transition-colors duration-150 ${
          locale === "ja"
            ? "border-accent-gold/40 bg-brand-navy text-accent-gold shadow-xs"
            : "border-transparent text-slate-400 hover:text-slate-200"
        }`}
        aria-label="Switch UI language to Japanese"
        aria-pressed={locale === "ja"}
      >
        JA
      </button>
    </div>
  );
};

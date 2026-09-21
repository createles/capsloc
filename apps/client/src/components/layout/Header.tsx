import React from "react";
import { Terminal, LogOut } from "lucide-react";
import { LanguageToggle } from "../ui/LanguageToggle";
import { useTranslation } from "../../i18n";

export interface HeaderProps {
  isConnected: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, onLogout }) => {
  const { t } = useTranslation();

  return (
    <header className="z-20 flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-panel/90 px-4 backdrop-blur-md select-none">
      {/* Left: Studio Branding with Modern Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent-gold/40 bg-brand-navy shadow-xs">
          <Terminal className="h-4 w-4 text-accent-gold" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="font-sans text-sm font-bold tracking-tight text-white">CapsLoc</span>
          <span className="font-sans text-[11px] text-slate-400">{t("header.studioSubtitle")}</span>
        </div>
        <span className="rounded-md border border-border-subtle bg-surface-card px-2 py-0.5 font-mono text-[10px] text-slate-400">
          v0.2.0
        </span>
      </div>

      {/* Right: Language Toggle, Discrete Status Dot & Sign Out Button */}
      <div className="flex items-center space-x-3.5 font-sans text-xs">
        <LanguageToggle />

        {/* Discrete Connection Status Dot */}
        <div
          className="flex items-center"
          title={isConnected ? t("header.connected") : t("header.reconnecting")}
        >
          <span
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              isConnected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                : "animate-pulse bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            }`}
          />
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-border-subtle bg-surface-card/60 px-2.5 py-1 text-slate-400 transition-all hover:border-white/20 hover:bg-surface-hover hover:text-white active:scale-[0.98]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="font-medium">{t("header.signOut")}</span>
        </button>
      </div>
    </header>
  );
};

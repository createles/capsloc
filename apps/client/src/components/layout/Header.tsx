import React from "react";
import { Terminal, LogOut } from "lucide-react";
import { LanguageToggle } from "../ui/LanguageToggle";
import { useTranslation } from "../../i18n";

export interface HeaderProps {
  isConnected: boolean;
  showGithub?: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, showGithub = false, onLogout }) => {
  const { t } = useTranslation();

  return (
    <header className="z-20 flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-panel/90 px-4 backdrop-blur-md select-none">
      {/* Left: CapsLoc Branding with Modern Badge, Github link */}
      <div className="flex items-center space-x-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent-gold/40 bg-brand-navy shadow-xs">
          <Terminal className="h-4 w-4 text-accent-gold" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="font-sans text-sm font-bold tracking-tight text-white">CapsLoc</span>
          <span className="font-sans text-[11px] text-slate-400">{t("header.subtitle")}</span>
        </div>
        <span className="rounded-md border border-border-subtle bg-surface-card px-2 py-0.5 font-mono text-[10px] text-slate-400">
          v1.0.0
        </span>

        {/* GitHub Repository Link */}
        {showGithub && (
          <a
            href="https://github.com/createles/capsloc"
            target="_blank"
            rel="noopener noreferrer"
            title={t("header.viewGithub")}
            className="flex cursor-pointer items-center space-x-1.5 rounded-md border border-border-subtle bg-surface-card px-2 py-0.5 font-mono text-[10px] text-slate-400 transition-all hover:border-white/20 hover:bg-surface-hover hover:text-white active:scale-[0.98]"
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 fill-current"
            >
              <title>GitHub</title>
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span>GitHub</span>
          </a>
        )}
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

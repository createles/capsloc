import React from "react";
import { Terminal, LogOut, Wifi, WifiOff } from "lucide-react";

export interface HeaderProps {
  isConnected: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, onLogout }) => {
  return (
    <header className="z-20 flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-panel/90 px-4 backdrop-blur-md select-none">
      {/* Left: Studio Branding with Modern Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent-gold/40 bg-brand-navy shadow-xs">
          <Terminal className="h-4 w-4 text-accent-gold" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="font-sans text-sm font-bold tracking-tight text-white">CapsLoc</span>
          <span className="font-sans text-[11px] text-slate-400">Localization Studio</span>
        </div>
        <span className="rounded-md border border-border-subtle bg-surface-card px-2 py-0.5 font-mono text-[10px] text-slate-400">
          v0.2.0
        </span>
      </div>

      {/* Right: Modern Telemetry Pill & Sign Out Button */}
      <div className="flex items-center space-x-3 font-sans text-xs">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all ${
            isConnected
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-xs"
              : "border-amber-500/20 bg-amber-500/10 text-amber-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isConnected ? "animate-pulse bg-emerald-400" : "bg-amber-400"
            }`}
          />
          {isConnected ? (
            <Wifi className="h-3 w-3 text-emerald-400" />
          ) : (
            <WifiOff className="h-3 w-3 text-amber-400" />
          )}
          <span className="text-[11px] font-medium">
            {isConnected ? "Connected" : "Reconnecting..."}
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-border-subtle bg-surface-card/60 px-2.5 py-1 text-slate-400 transition-all hover:border-white/20 hover:bg-surface-hover hover:text-white active:scale-[0.98]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

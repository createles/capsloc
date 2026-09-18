import React from "react";
import { Terminal, LogOut, Wifi, WifiOff } from "lucide-react";

export interface HeaderProps {
  isConnected: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, onLogout }) => {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border-subtle bg-surface-panel px-4 select-none shrink-0">
      {/* Left: Studio Branding */}
      <div className="flex items-center space-x-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-navy border border-accent-gold/40">
          <Terminal className="h-4 w-4 text-accent-gold" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="font-sans text-sm font-bold tracking-tight text-white">CapsLoc</span>
          <span className="text-[11px] font-sans text-gray-400">Localization Studio</span>
        </div>
        <span className="rounded-md bg-surface-card px-2 py-0.5 text-[10px] font-mono text-gray-400 border border-border-subtle">
          v0.2.0
        </span>
      </div>

      {/* Right: Online Status & Sign Out */}
      <div className="flex items-center space-x-4 text-xs font-sans">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border transition-colors ${
            isConnected
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}
        >
          {isConnected ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Wifi className="h-3 w-3 text-emerald-400" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <WifiOff className="h-3 w-3 text-amber-400" />
              <span>Connecting...</span>
            </>
          )}
        </span>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-gray-400 hover:bg-surface-hover hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};

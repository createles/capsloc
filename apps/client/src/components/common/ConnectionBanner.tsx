import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../i18n";

export const ConnectionBanner: React.FC = () => {
  const { isConnected } = useSocket();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Render only when user is logged in but the WebSocket connection is severed
  if (!isAuthenticated || isConnected) {
    return null;
  }

  const handleManualReconnect = () => {
    window.location.reload();
  };

  return (
    <div className="z-30 flex shrink-0 items-center justify-between border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 font-sans text-xs text-amber-200 backdrop-blur-sm select-none">
      <div className="flex items-center space-x-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/20 text-amber-300">
          <WifiOff className="h-3.5 w-3.5 animate-pulse" />
        </div>
        <span className="font-medium text-amber-100">{t("banner.offline")}</span>
      </div>

      <button
        type="button"
        onClick={handleManualReconnect}
        className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1 font-sans text-xs font-semibold text-amber-200 shadow-xs transition-colors hover:bg-amber-500/30 hover:text-white active:scale-[0.98]"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        <span>{t("banner.reconnectNow")}</span>
      </button>
    </div>
  );
};

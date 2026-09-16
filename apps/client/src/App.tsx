import React, { useState } from "react";
import {
  Terminal,
  LogOut,
  Loader2,
  Wifi,
  WifiOff,
  BookOpen,
} from "lucide-react";
import { type ChannelDTO } from "@capsloc/types";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider, useSocket } from "./context/SocketContext";
import { AuthModal } from "./components/auth/AuthModal";
import { ChannelSidebar } from "./components/layout/ChannelSidebar";
import { MessageList } from "./components/chat/MessageList";
import { TypingIndicator } from "./components/chat/TypingIndicator";
import { MessageInput } from "./components/chat/MessageInput";
import { LocInspectorDrawer } from "./components/inspector/LocInspectorDrawer";

const LocTerminal: React.FC = () => {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { isConnected } = useSocket();
  const [activeChannel, setActiveChannel] = useState<ChannelDTO | null>(null);

  // Decoupled drawer state:
  const [selectedStringKey, setSelectedStringKey] = useState<string | null>(
    "LOC-MH-001",
  );
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-surface-canvas text-gray-400 font-sans text-xs">
        <Loader2 className="h-6 w-6 animate-spin text-accent-gold mb-3" />
        <span>Connecting to CapsLoc...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthModal />;
  }

  const handleSelectStringKey = (key: string) => {
    setSelectedStringKey(key);
    setIsInspectorOpen(true);
  };

  const handleToggleInspector = () => {
    setIsInspectorOpen((prev) => !prev);
  };

  const handleCloseInspector = () => {
    setIsInspectorOpen(false);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-canvas text-gray-200">
      {/* Top Header */}
      <header className="flex h-12 items-center justify-between border-b border-border-subtle bg-surface-panel px-4 select-none">
        <div className="flex items-center space-x-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-navy border border-accent-gold/40">
            <Terminal className="h-4 w-4 text-accent-gold" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-sans text-sm font-bold tracking-tight text-white">
              CapsLoc
            </span>
            <span className="text-[11px] font-sans text-gray-400">
              Localization Studio
            </span>
          </div>
          <span className="rounded-md bg-surface-card px-2 py-0.5 text-[10px] font-mono text-gray-400 border border-border-subtle">
            v0.2.0
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs font-sans">
          {/* Network Presence Badge */}
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

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-gray-400 hover:bg-surface-hover hover:text-white transition-
  colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Three-Pane Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <ChannelSidebar
          activeChannelId={activeChannel?.id || null}
          onSelectChannel={setActiveChannel}
        />

        {/* Center Chat Viewport */}
        <main className="flex-1 flex flex-col bg-surface-canvas overflow-hidden min-w-0">
          {/* Channel Header Bar */}
          <div
            className="border-b border-border-subtle bg-surface-panel/70 px-4 py-2.5 text-xs font-sans text-gray-400 flex items-center
  justify-between shrink-0"
          >
            <div className="flex items-center space-x-2 truncate">
              <span className="text-white font-semibold text-sm">
                #{activeChannel?.name || "select-channel"}
              </span>
              {activeChannel?.localeTag && (
                <span
                  className="rounded-md bg-brand-navy/60 px-2 py-0.5 text-[10px] font-mono text-accent-gold border border-accent-
  gold/20"
                >
                  {activeChannel.localeTag}
                </span>
              )}
              {activeChannel?.description && (
                <span className="text-gray-400 text-xs truncate max-w-md hidden md:inline ml-2">
                  {activeChannel.description}
                </span>
              )}
            </div>

            {/* Right: Inspector Drawer Toggle Button */}
            {activeChannel && (
              <button
                type="button"
                onClick={handleToggleInspector}
                className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  isInspectorOpen
                    ? "bg-brand-navy text-accent-gold border border-accent-gold/30"
                    : "text-gray-400 hover:text-white hover:bg-surface-hover border border-transparent"
                }`}
                title={
                  isInspectorOpen
                    ? "Collapse String Inspector"
                    : "Open String Inspector"
                }
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Inspector</span>
                {selectedStringKey && (
                  <span className="font-mono text-[10px] text-accent-gold/90 bg-black/30 px-1.5 py-0.2 rounded">
                    #{selectedStringKey}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Messages Stream & Active Input */}
          {activeChannel ? (
            <>
              <MessageList
                channelId={activeChannel.id}
                onSelectStringKey={handleSelectStringKey}
              />
              <TypingIndicator channelId={activeChannel.id} />
              <MessageInput
                channelId={activeChannel.id}
                channelName={activeChannel.name}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center font-sans text-xs text-gray-500 space-y-2">
              <Terminal className="h-8 w-8 text-gray-600 mb-2" />
              <span>Select a channel to start messaging</span>
            </div>
          )}
        </main>

        {/* Right Localization Inspector Slide-Out Drawer */}
        {isInspectorOpen && (
          <LocInspectorDrawer
            stringKey={selectedStringKey}
            onClose={handleCloseInspector}
          />
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <LocTerminal />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;

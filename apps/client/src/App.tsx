import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { type ChannelDTO, type UserProfileDTO } from "@capsloc/types";
import { api } from "./services/api";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { SocketProvider } from "./context/SocketProvider";
import { useSocket } from "./hooks/useSocket";
import { AuthModal } from "./components/auth/AuthModal";
import { Header } from "./components/layout/Header";
import { ChannelSidebar } from "./components/layout/ChannelSidebar";
import { ChatPane } from "./components/layout/ChatPane";
import { LocInspectorDrawer } from "./components/inspector/LocInspectorDrawer";
import { InviteMemberModal } from "./components/channels/InviteMemberModal";
import { ChannelMembersModal } from "./components/channels/ChannelMembersModal";
import { EditChannelStatusModal } from "./components/channels/EditChannelStatusModal";
import { MentionToast } from "./components/common/MentionToast";

const INSPECTOR_STORAGE_KEY = "capsloc:inspector_open";

const getInitialInspectorOpen = (): boolean => {
  try {
    return sessionStorage.getItem(INSPECTOR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const LocTerminal: React.FC = () => {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const {
    socket,
    isConnected,
    onlineUsers,
    activeMentionToast,
    dismissMentionToast,
    setActiveChannelId,
  } = useSocket();
  const [activeChannel, setActiveChannel] = useState<ChannelDTO | null>(null);

  // Decoupled drawer state:
  const isInspectorOpenRef = useRef<boolean>(getInitialInspectorOpen());
  const [selectedStringKey, setSelectedStringKey] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(getInitialInspectorOpen());

  useEffect(() => {
    isInspectorOpenRef.current = isInspectorOpen;
    try {
      sessionStorage.setItem(INSPECTOR_STORAGE_KEY, String(isInspectorOpen));
    } catch (e) {
      console.error("Failed to persist inspector state to sessionStorage:", e);
    }
  }, [isInspectorOpen]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem(INSPECTOR_STORAGE_KEY, String(isInspectorOpenRef.current));
      } catch {
        // ignore
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // In-chat tag highlight state
  const [highlightedTagKey, setHighlightedTagKey] = useState<string | null>(null);
  const [mentionsCount, setMentionsCount] = useState<number>(0);

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);

  // Pinned sprint status banner state
  const [dismissedBannerChannelIds, setDismissedBannerChannelIds] = useState<
    Record<string, boolean>
  >({});

  // Listen for real-time channel updates (sprint status, description)
  useEffect(() => {
    if (!socket) return;
    const handleChannelUpdated = (updatedChannel: ChannelDTO) => {
      setActiveChannel((prev) => {
        if (prev?.id === updatedChannel.id) {
          if (prev.status !== updatedChannel.status) {
            setDismissedBannerChannelIds((d) => {
              const next = { ...d };
              delete next[updatedChannel.id];
              return next;
            });
          }
          return { ...prev, ...updatedChannel };
        }
        return prev;
      });
    };

    socket.on("channel_updated", handleChannelUpdated);
    return () => {
      socket.off("channel_updated", handleChannelUpdated);
    };
  }, [socket]);

  // Listen for real-time user updates (custom status, profile)
  useEffect(() => {
    if (!socket) return;
    const handleUserUpdated = (updatedUser: UserProfileDTO) => {
      setActiveChannel((prev) => {
        if (!prev || !prev.members) return prev;
        const hasUser = prev.members.some((m) => m.userId === updatedUser.id);
        if (!hasUser) return prev;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.userId === updatedUser.id
              ? { ...m, user: { ...m.user, ...updatedUser } }
              : m
          ),
        };
      });
    };

    socket.on("user_updated", handleUserUpdated);
    return () => {
      socket.off("user_updated", handleUserUpdated);
    };
  }, [socket]);

  const handleDismissBanner = (channelId: string) => {
    setDismissedBannerChannelIds((prev) => ({ ...prev, [channelId]: true }));
  };

  const handleRestoreBanner = (channelId: string) => {
    setDismissedBannerChannelIds((prev) => {
      const next = { ...prev };
      delete next[channelId];
      return next;
    });
  };

  const isBannerVisible =
    Boolean(activeChannel?.status) && !dismissedBannerChannelIds[activeChannel?.id || ""];

  const handleSelectChannel = (channel: ChannelDTO) => {
    setActiveChannel(channel);
    setActiveChannelId(channel.id);
    setHighlightedTagKey(null);
    setMentionsCount(0);
  };

  const handleMemberAdded = (updatedChannel: ChannelDTO) => {
    setActiveChannel(updatedChannel);
  };

  const handleJumpToChannel = async (channelId: string) => {
    try {
      const { data } = await api.get<ChannelDTO>(`/channels/${channelId}`);
      setActiveChannel(data);
      setActiveChannelId(data.id);
      setHighlightedTagKey(null);
      setMentionsCount(0);
    } catch (err) {
      console.error("Failed to jump to channel:", err);
    }
  };

  const handleOpenDm = async (recipientId: string) => {
    try {
      const { data: dmChannel } = await api.post<ChannelDTO>("/channels/dm", {
        recipientId,
      });
      handleSelectChannel(dmChannel);
    } catch (err) {
      console.error("Failed to open direct message channel:", err);
    }
  };

  const handleToggleTagHighlight = (key: string) => {
    setHighlightedTagKey((prev) => (prev === key ? null : key));
  };

  const handleSelectStringKey = (key: string) => {
    setSelectedStringKey(key);
    setIsInspectorOpen(true);
    setHighlightedTagKey(null);
  };

  const handleToggleInspector = () => {
    setIsInspectorOpen((prev) => {
      if (prev) setHighlightedTagKey(null);
      return !prev;
    });
  };

  const handleCloseInspector = () => {
    setIsInspectorOpen(false);
    setHighlightedTagKey(null);
  };

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

  return (
    <div className="flex h-screen w-screen flex-col bg-surface-canvas text-gray-200">
      {/* 1. Top Header */}
      <Header isConnected={isConnected} onLogout={logout} />

      {/* 2. Main Three-Pane Work Area (Left -> Right) */}
      <div className="flex flex-1 overflow-hidden">
        {/* [LEFT] Channel Sidebar */}
        <ChannelSidebar
          activeChannelId={activeChannel?.id || null}
          onSelectChannel={handleSelectChannel}
        />

        {/* [CENTER] Chat Pane & Active Input */}
        <ChatPane
          activeChannel={activeChannel}
          currentUser={user}
          onlineUsers={onlineUsers}
          isInspectorOpen={isInspectorOpen}
          selectedStringKey={selectedStringKey}
          highlightedTagKey={highlightedTagKey}
          onToggleInspector={handleToggleInspector}
          onSelectStringKey={handleSelectStringKey}
          onDismissTagHighlight={() => setHighlightedTagKey(null)}
          onReportMatchesCount={setMentionsCount}
          onOpenDm={handleOpenDm}
          onOpenMembers={() => setIsMembersModalOpen(true)}
          onOpenInvite={() => setIsInviteModalOpen(true)}
          onOpenEditStatus={() => setIsEditStatusModalOpen(true)}
          isBannerVisible={isBannerVisible}
          onDismissBanner={handleDismissBanner}
          onRestoreBanner={handleRestoreBanner}
        />

        {/* [RIGHT] Localization Inspector Slide-Out Drawer */}
        {isInspectorOpen && (
          <LocInspectorDrawer
            stringKey={selectedStringKey}
            onClose={handleCloseInspector}
            mentionsCountInCurrentChat={mentionsCount}
            isTagHighlightActive={!!highlightedTagKey && highlightedTagKey === selectedStringKey}
            onToggleTagHighlight={handleToggleTagHighlight}
          />
        )}
      </div>

      {/* 3. Global Overlays & Modals */}
      {isEditStatusModalOpen && activeChannel && (
        <EditChannelStatusModal
          channel={activeChannel}
          onClose={() => setIsEditStatusModalOpen(false)}
          onUpdated={(updated) => setActiveChannel(updated)}
        />
      )}

      {isInviteModalOpen && activeChannel && (
        <InviteMemberModal
          channel={activeChannel}
          onClose={() => setIsInviteModalOpen(false)}
          onMemberAdded={handleMemberAdded}
        />
      )}

      {isMembersModalOpen && activeChannel && (
        <ChannelMembersModal
          channel={activeChannel}
          onClose={() => setIsMembersModalOpen(false)}
          onOpenInvite={() => setIsInviteModalOpen(true)}
        />
      )}

      <MentionToast
        toast={activeMentionToast}
        onDismiss={dismissMentionToast}
        onJumpToChannel={handleJumpToChannel}
      />
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

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  AtSign,
  ChevronDown,
} from "lucide-react";
import {
  type AttachmentDTO,
  type ChannelMemberDTO,
  type UserProfileDTO,
  LocRole,
} from "@capsloc/types";
import { api } from "../../services/api";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "../../i18n";
import { LocRoleBadge } from "../ui/LocRoleBadge";
import { AttachmentTagPicker } from "./AttachmentTagPicker";

export interface MessageInputProps {
  channelId: string;
  channelName?: string | null;
  channelLocaleTag?: string | null;
  isDm?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  channelName,
  channelLocaleTag,
  isDm,
}) => {
  const { user } = useAuth();
  const { socket, sendMessage, startTyping, stopTyping } = useSocket();
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [stagedAttachments, setStagedAttachments] = useState<AttachmentDTO[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTagPickerId, setActiveTagPickerId] = useState<string | null>(null);

  // Mention (@tag) state
  const [directoryUsers, setDirectoryUsers] = useState<UserProfileDTO[]>([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionCursorIndex, setMentionCursorIndex] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRoomMembers = async () => {
      if (!channelId) return;
      try {
        const { data } = await api.get<ChannelMemberDTO[]>(`/channels/${channelId}/members`);
        if (isMounted) {
          const roomUsers = data.map((m) => m.user).filter((u): u is UserProfileDTO => Boolean(u));
          setDirectoryUsers(roomUsers);
        }
      } catch (err) {
        console.error("Failed to load room members for mentions:", err);
        if (isMounted) {
          setDirectoryUsers([]);
        }
      }
    };
    fetchRoomMembers();
    return () => {
      isMounted = false;
    };
  }, [channelId]);

  // Synchronize directory users on real-time profile updates
  useEffect(() => {
    if (!socket) return;
    const handleUserUpdated = (updatedUser: UserProfileDTO) => {
      setDirectoryUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)),
      );
    };

    socket.on("user_updated", handleUserUpdated);
    return () => {
      socket.off("user_updated", handleUserUpdated);
    };
  }, [socket]);

  const stopTypingRef = useRef(stopTyping);
  useEffect(() => {
    stopTypingRef.current = stopTyping;
  });

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTypingRef.current(channelId);
    };
  }, [channelId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 192)}px`;
    }
  }, [content]);

  const filteredMentionUsers = directoryUsers
    .filter((u) => u.id !== user?.id)
    .filter((u) => {
      const q = mentionQuery.toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.locRole?.toLowerCase().includes(q)
      );
    });

  const insertMention = (targetUser: UserProfileDTO) => {
    if (!textareaRef.current) return;
    const beforeMention = content.slice(0, mentionCursorIndex);
    const afterMention = content.slice(textareaRef.current.selectionStart || mentionCursorIndex);
    const newContent = `${beforeMention}@${targetUser.username} ${afterMention}`;

    setContent(newContent);
    setShowMentionPicker(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + targetUser.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    setContent(text);

    startTyping(channelId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(channelId);
    }, 1500);

    const textBeforeCursor = text.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/);

    if (mentionMatch) {
      const matchIndex = textBeforeCursor.lastIndexOf("@");
      setMentionCursorIndex(matchIndex);
      setMentionQuery(mentionMatch[1] || "");
      setSelectedMentionIndex(0);
      setShowMentionPicker(true);
    } else {
      setShowMentionPicker(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker && filteredMentionUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredMentionUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(
          (prev) => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const chosen = filteredMentionUsers[selectedMentionIndex];
        if (chosen) {
          insertMention(chosen);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionPicker(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTriggerMention = () => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart || content.length;
    const newContent = `${content.slice(0, cursor)}@${content.slice(cursor)}`;
    setContent(newContent);
    setMentionCursorIndex(cursor);
    setMentionQuery("");
    setSelectedMentionIndex(0);
    setShowMentionPicker(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursor + 1, cursor + 1);
      }
    }, 10);
  };

  const inferDefaultTag = (): string => {
    if (user?.locRole === LocRole.TRANSLATOR) return "JA-REF";
    if (user?.locRole === LocRole.LQA_TESTER) return "UI-OVERFLOW";
    if (channelLocaleTag) {
      const clean = channelLocaleTag.replace("->", "-").toUpperCase();
      return `${clean}-BUG`;
    }
    return "UI-OVERFLOW";
  };

  const handleUpdateTag = async (attachmentId: string, newTag: string | null) => {
    setStagedAttachments((prev) =>
      prev.map((a) => (a.id === attachmentId ? { ...a, localeTag: newTag } : a)),
    );
    try {
      await api.patch(`/uploads/${attachmentId}`, { localeTag: newTag });
    } catch (err) {
      console.error("Failed to update attachment tag:", err);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", file, `screenshot_${Date.now()}.png`);
          formData.append("localeTag", inferDefaultTag());

          const { data } = await api.post<AttachmentDTO>("/uploads", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          setStagedAttachments((prev) => [...prev, data]);
        } catch (err) {
          console.error("Clipboard paste upload failed:", err);
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0]!;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("localeTag", inferDefaultTag());

      const { data } = await api.post<AttachmentDTO>("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStagedAttachments((prev) => [...prev, data]);
    } catch (err) {
      console.error("Drop upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]!;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("localeTag", inferDefaultTag());

      const { data } = await api.post<AttachmentDTO>("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStagedAttachments((prev) => [...prev, data]);
    } catch (err) {
      console.error("Pre-upload staging failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (attachmentId: string) => {
    if (activeTagPickerId === attachmentId) {
      setActiveTagPickerId(null);
    }
    setStagedAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed && stagedAttachments.length === 0) return;
    if (isSending) return;

    setIsSending(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(channelId);

    try {
      sendMessage({
        channelId,
        content: trimmed,
        attachmentIds: stagedAttachments.map((a) => a.id),
      });

      setContent("");
      setStagedAttachments([]);
      textareaRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="shrink-0 border-t border-border-subtle bg-surface-panel p-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.log,.json,.csv,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Staged Attachments Strip */}
      {(stagedAttachments.length > 0 || isUploading) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {stagedAttachments.map((att) => (
            <div
              key={att.id}
              className="relative flex items-center space-x-1.5 rounded-md border border-border-subtle bg-surface-card px-2.5 py-1 font-sans text-xs text-gray-200"
            >
              <ImageIcon className="h-3.5 w-3.5 shrink-0 text-accent-gold" />
              <span className="max-w-xs truncate">{att.fileName}</span>
              <span className="font-mono text-[10px] text-gray-500">
                ({(att.fileSize / 1024).toFixed(1)} KB)
              </span>

              {/* Interactive Tag Pill Trigger */}
              <button
                type="button"
                onClick={() => setActiveTagPickerId(activeTagPickerId === att.id ? null : att.id)}
                className="flex cursor-pointer items-center gap-1 rounded border border-accent-gold/40 bg-brand-navy px-1.5 py-0.5 font-mono text-[10px] font-medium text-accent-gold uppercase transition-colors hover:bg-brand-navy/80"
                title={t("composer.editTag")}
              >
                <span>{att.localeTag || t("composer.addTag")}</span>
                <ChevronDown className="h-2.5 w-2.5 opacity-70" />
              </button>

              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="ml-1 cursor-pointer text-gray-400 transition-colors hover:text-status-flagged"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Tag Picker Popover */}
              {activeTagPickerId === att.id && (
                <AttachmentTagPicker
                  currentTag={att.localeTag}
                  channelLocaleTag={channelLocaleTag}
                  onSelectTag={(tag) => handleUpdateTag(att.id, tag)}
                  onClose={() => setActiveTagPickerId(null)}
                />
              )}
            </div>
          ))}

          {isUploading && (
            <div className="flex items-center space-x-1.5 rounded-md border border-accent-gold/30 bg-brand-navy/60 px-2.5 py-1 font-sans text-xs text-accent-gold">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-gold" />
              <span>{t("composer.uploadingAttachment")}</span>
            </div>
          )}
        </div>
      )}

      {/* Textarea Composer Container with Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`relative flex flex-col justify-between rounded-xl border p-2.5 shadow-xs transition-all ${
          isDragging
            ? "border-dashed border-accent-gold bg-accent-gold/5"
            : "border-border-subtle bg-surface-card/80 focus-within:border-accent-gold/40 focus-within:ring-1 focus-within:ring-accent-gold/20"
        }`}
      >
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center space-x-2 rounded-xl bg-surface-card/90 font-sans text-xs font-semibold text-accent-gold">
            <UploadCloud className="h-5 w-5 animate-pulse" />
            <span>{t("composer.dropToAttach")}</span>
          </div>
        )}

        {/* @Mention Autocomplete Popover */}
        {showMentionPicker && filteredMentionUsers.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-0 z-40 mb-2 max-h-56 w-80 overflow-y-auto rounded-xl border border-border-subtle bg-surface-panel p-1.5 font-sans shadow-2xl duration-150">
            <div className="flex items-center justify-between border-b border-border-subtle/50 px-2.5 py-1 font-mono text-[10px] tracking-wider text-slate-400 uppercase">
              <span>{t("composer.mentionHeader")}</span>
              <span className="text-accent-gold">@{mentionQuery || "..."}</span>
            </div>
            <div className="mt-1 space-y-0.5">
              {filteredMentionUsers.map((targetUser, idx) => {
                const isSelected = idx === selectedMentionIndex;
                const initials = (targetUser.displayName || targetUser.username)
                  .substring(0, 2)
                  .toUpperCase();
                return (
                  <button
                    key={targetUser.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(targetUser);
                    }}
                    onMouseEnter={() => setSelectedMentionIndex(idx)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors ${
                      isSelected
                        ? "border border-accent-gold/30 bg-brand-navy text-accent-gold"
                        : "border border-transparent text-slate-200 hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex min-w-0 items-center space-x-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-accent-gold/20 bg-brand-navy font-mono text-[9px] font-bold text-accent-gold">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="truncate text-xs font-semibold">
                            {targetUser.displayName}
                          </span>
                          <LocRoleBadge role={targetUser.locRole} />
                        </div>
                        <span className="block truncate font-mono text-[10px] text-slate-400">
                          @{targetUser.username}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          placeholder={
            isDm
              ? t("composer.placeholderDm", { recipient: channelName || "teammate" })
              : t("composer.placeholderChannel", { channel: channelName || "channel" })
          }
          className="w-full resize-none bg-transparent font-sans text-sm leading-relaxed text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {/* Action Toolbar */}
        <div className="mt-1.5 flex items-center justify-between border-t border-border-subtle/50 pt-1.5">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title={t("composer.attachTooltip")}
              className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-surface-hover hover:text-accent-gold disabled:opacity-50"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleTriggerMention}
              title={t("composer.mentionTooltip")}
              className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-surface-hover hover:text-accent-gold"
            >
              <AtSign className="h-4 w-4" />
            </button>

            {/* Quick #LOC Tag Insertion Trigger */}
            <button
              type="button"
              onClick={() => {
                setContent((prev) => {
                  const spacer = prev.length > 0 && !/\s$/.test(prev) ? " " : "";
                  return `${prev}${spacer}#LOC-`;
                });
                textareaRef.current?.focus();
              }}
              title={t("composer.locTagTooltip")}
              className="cursor-pointer rounded border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 transition-colors hover:bg-emerald-900/60 hover:text-emerald-300"
            >
              #LOC
            </button>

            {/* Quick $STR Tag Insertion Trigger */}
            <button
              type="button"
              onClick={() => {
                setContent((prev) => {
                  const spacer = prev.length > 0 && !/\s$/.test(prev) ? " " : "";
                  return `${prev}${spacer}$STR_`;
                });
                textareaRef.current?.focus();
              }}
              title={t("composer.strTagTooltip")}
              className="cursor-pointer rounded border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400 transition-colors hover:bg-emerald-900/60 hover:text-emerald-300"
            >
              $STR
            </button>

            <span className="ml-1 hidden font-sans text-[10px] text-slate-500 sm:inline">
              {t("composer.uploadHint")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={(!content.trim() && stagedAttachments.length === 0) || isSending}
            className="flex cursor-pointer items-center space-x-1.5 rounded-lg border border-accent-gold/40 bg-brand-navy px-3 py-1.5 font-sans text-xs font-semibold text-accent-gold shadow-xs transition-all hover:bg-brand-navy-light active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-brand-navy"
          >
            <span>{isSending ? t("composer.sending") : t("composer.send")}</span>
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

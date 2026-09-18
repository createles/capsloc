import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  AtSign,
} from "lucide-react";
import type { AttachmentDTO, UserProfileDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { LocRoleBadge } from "../ui/LocRoleBadge";

export interface MessageInputProps {
  channelId: string;
  channelName?: string | null;
  isDm?: boolean; // appropriately replaces #channel in placeholder to @recipient
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  channelName,
  isDm,
}) => {
  const { user } = useAuth();
  const { sendMessage, startTyping, stopTyping } = useSocket();
  const [content, setContent] = useState("");
  const [stagedAttachments, setStagedAttachments] = useState<AttachmentDTO[]>(
    [],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Mention (@tag) state
  const [directoryUsers, setDirectoryUsers] = useState<UserProfileDTO[]>([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionCursorIndex, setMentionCursorIndex] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-load user directory for @tag autocomplete
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const { data } = await api.get<UserProfileDTO[]>("/users");
        if (isMounted) {
          setDirectoryUsers(data);
        }
      } catch (err) {
        console.error("Failed to load user directory for mentions:", err);
      }
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep stopTypingRef pointing to the latest socket dispatcher:
  const stopTypingRef = useRef(stopTyping);
  useEffect(() => {
    stopTypingRef.current = stopTyping;
  });

  // Stop typing and clean up timeouts when unmounting or switching channels:
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTypingRef.current(channelId);
    };
  }, [channelId]); // Runs strictly on channel switch or component unmount

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
    const afterMention = content.slice(
      textareaRef.current.selectionStart || mentionCursorIndex,
    );
    const newContent = `${beforeMention}@${targetUser.username} ${afterMention}`;

    setContent(newContent);
    setShowMentionPicker(false);

    // Position cursor after inserted username
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos =
          beforeMention.length + targetUser.username.length + 2;
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

    // Detect @mention trigger
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
        setSelectedMentionIndex(
          (prev) => (prev + 1) % filteredMentionUsers.length,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(
          (prev) =>
            (prev - 1 + filteredMentionUsers.length) %
            filteredMentionUsers.length,
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

  // 1. Direct Clipboard Paste (Win+Shift+S / Cmd+Shift+4)
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
          formData.append("localeTag", "LQA-Paste");

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

  // 2. Drag & Drop Upload
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
      formData.append("localeTag", "QA-Drop");

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

  // 3. File Input Picker Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]!;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("localeTag", "QA-Screenshot");

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
    <div className="p-3 bg-surface-panel border-t border-border-subtle shrink-0">
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
        <div className="mb-2 flex flex-wrap gap-2 items-center">
          {stagedAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center space-x-1.5 rounded-md border border-border-subtle bg-surface-card px-2.5 py-1 text-xs font-sans
  text-gray-200"
            >
              <ImageIcon className="h-3.5 w-3.5 text-accent-gold shrink-0" />
              <span className="truncate max-w-xs">{att.fileName}</span>
              <span className="text-[10px] text-gray-500 font-mono">
                ({(att.fileSize / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="ml-1 text-gray-400 hover:text-status-flagged transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {isUploading && (
            <div
              className="flex items-center space-x-1.5 rounded-md border border-accent-gold/30 bg-brand-navy/60 px-2.5 py-1 text-xs font-
  sans text-accent-gold"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-gold" />
              <span>Uploading attachment...</span>
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
        className={`relative rounded-lg border transition-all p-2 flex flex-col justify-between ${
          isDragging
            ? "border-dashed border-accent-gold bg-accent-gold/5"
            : "border-border-subtle bg-surface-card focus-within:border-accent-gold/50"
        }`}
      >
        {isDragging && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-surface-card/90 rounded-lg pointer-events-none space-x-2
  text-accent-gold font-sans text-xs font-semibold"
          >
            <UploadCloud className="h-5 w-5 animate-pulse" />
            <span>Drop file to attach</span>
          </div>
        )}

        {/* @Mention Autocomplete Popover */}
        {showMentionPicker && filteredMentionUsers.length > 0 && (
          <div className="absolute bottom-full mb-2 left-0 w-80 max-h-56 overflow-y-auto rounded-lg border border-border-subtle bg-surface-panel shadow-2xl z-40 p-1 font-sans animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-400 border-b border-border-subtle/50 flex items-center justify-between">
              <span>Mention Colleague</span>
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
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-brand-navy text-accent-gold border border-accent-gold/30"
                        : "hover:bg-surface-hover text-gray-200 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="h-6 w-6 rounded bg-brand-navy border border-accent-gold/20 flex items-center justify-center font-mono text-[9px] font-bold text-accent-gold shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-semibold truncate">
                            {targetUser.displayName}
                          </span>
                          <LocRoleBadge role={targetUser.locRole} />
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 truncate block">
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
          rows={2}
          placeholder={
            isDm
              ? `Message @${channelName || "teammate"}... (Shift+Enter for newline, type @name to tag or #LOC-XXXX)`
              : `Message #${channelName || "channel"}... (Shift+Enter for newline, type @name to tag or #LOC-XXXX)`
          }
          className="w-full bg-transparent text-xs text-gray-100 placeholder-gray-500 focus:outline-none resize-none font-sans"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-1 border-t border-border-subtle/50 mt-1">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Attach screenshot or document"
              className="p-1 rounded text-gray-400 hover:text-accent-gold hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleTriggerMention}
              title="Tag colleague (@)"
              className="p-1 rounded text-gray-400 hover:text-accent-gold hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <AtSign className="h-4 w-4" />
            </button>

            <span className="text-[10px] font-sans text-gray-500 hidden sm:inline">
              Max 10MB &bull; Paste or drop screenshots
            </span>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={
              (!content.trim() && stagedAttachments.length === 0) || isSending
            }
            className="flex items-center space-x-1.5 rounded-md bg-brand-navy hover:bg-brand-navy-light px-3 py-1.5 text-xs font-sans font-
  semibold text-accent-gold border border-accent-gold/40 transition-colors disabled:opacity-40 disabled:hover:bg-brand-navy cursor-pointer"
          >
            <span>Send</span>
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

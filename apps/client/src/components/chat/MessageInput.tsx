import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
} from "lucide-react";
import type { AttachmentDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { useSocket } from "../../context/SocketContext";

export interface MessageInputProps {
  channelId: string;
  channelName?: string | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  channelId,
  channelName,
}) => {
  const { sendMessage, startTyping, stopTyping } = useSocket();
  const [content, setContent] = useState("");
  const [stagedAttachments, setStagedAttachments] = useState<AttachmentDTO[]>(
    [],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop typing and clean up timeouts when unmounting or switching channels
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping(channelId);
    };
  }, [channelId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);

    startTyping(channelId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(channelId);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={2}
          placeholder={`Message #${channelName || "channel"}... (Shift+Enter for newline, type #LOC-XXXX to tag)`}
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
              className="p-1 rounded text-gray-400 hover:text-accent-gold hover:bg-surface-hover transition-colors disabled:opacity-50
  cursor-pointer"
            >
              <Paperclip className="h-4 w-4" />
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

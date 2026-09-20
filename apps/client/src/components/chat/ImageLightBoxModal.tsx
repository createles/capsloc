import React, { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Download, Image as ImageIcon } from "lucide-react";
import type { AttachmentDTO } from "@capsloc/types";
import { useTranslation } from "../../i18n";

export interface ImageLightboxModalProps {
  attachment: AttachmentDTO | null;
  uploaderName?: string;
  onClose: () => void;
  onSelectStringKey?: (key: string) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  attachment,
  uploaderName,
  onClose,
}) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!attachment) return null;

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.min(Number((prev + 0.5).toFixed(2)), 2.5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.max(Number((prev - 0.5).toFixed(2)), 1));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom === 1) {
      setZoom(1.75);
    } else {
      setZoom(1);
    }
  };

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md duration-150 select-none"
      onClick={onClose}
    >
      {/* Lightbox Header Bar */}
      <div
        className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-surface-panel/90 px-5 text-xs backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 font-sans text-slate-300">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent-gold/40 bg-brand-navy shadow-inner">
            <ImageIcon className="h-4 w-4 text-accent-gold" />
          </div>
          <span className="max-w-sm truncate font-semibold text-white">{attachment.fileName}</span>
          <span className="shrink-0 font-mono text-[11px] text-slate-400">
            ({(attachment.fileSize / 1024).toFixed(1)} KB)
          </span>
          {uploaderName && (
            <span className="hidden truncate text-[11px] text-slate-400 sm:inline">
              {t("lightbox.uploadedBy")} <strong className="text-slate-200">{uploaderName}</strong>
            </span>
          )}
          {attachment.localeTag && (
            <span className="shrink-0 rounded-md border border-accent-gold/40 bg-accent-gold/10 px-2 py-0.5 font-mono text-[10px] text-accent-gold uppercase">
              {attachment.localeTag}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Paired Zoom Buttons */}
          <div className="flex items-center space-x-1 rounded-lg border border-white/[0.08] bg-surface-card/90 px-2 py-1 font-mono text-xs text-slate-300">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="cursor-pointer rounded-md p-1 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title={t("lightbox.zoomOut")}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="w-12 text-center text-[11px] font-bold text-accent-gold select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 2.5}
              className="cursor-pointer rounded-md p-1 transition-all hover:bg-white/[0.08] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
              title={t("lightbox.zoomIn")}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <a
            href={attachment.fileUrl}
            download={attachment.fileName}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] p-2 text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
            title={t("lightbox.download")}
          >
            <Download className="h-4 w-4" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.04] p-2 text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white active:scale-95"
            title={t("lightbox.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image Inspection Canvas */}
      <div
        className={`flex flex-1 items-center justify-center overflow-auto p-6 ${
          zoom === 1 ? "cursor-zoom-in" : "cursor-zoom-out"
        }`}
        onClick={handleCanvasClick}
      >
        <img
          src={attachment.fileUrl}
          alt={attachment.fileName}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
          className="max-h-[85vh] max-w-[90vw] rounded-2xl border border-white/[0.08] object-contain shadow-2xl shadow-black/90 transition-transform duration-200 ease-out"
        />
      </div>
    </div>
  );
};

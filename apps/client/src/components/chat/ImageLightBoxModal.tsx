import React, { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Download, Image as ImageIcon } from "lucide-react";
import type { AttachmentDTO } from "@capsloc/types";

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
  const [zoom, setZoom] = useState<number>(1);

  // Close on Escape key
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

  // Canvas toggle: 1x -> 1.75x, and >1x -> 1x
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
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      {/* Lightbox Header Bar */}
      <div
        className="flex h-12 items-center justify-between px-4 bg-surface-panel/90 border-b border-border-subtle shrink-0 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 text-gray-300 font-sans">
          <ImageIcon className="h-4 w-4 text-accent-gold shrink-0" />
          <span className="font-semibold text-white truncate max-w-sm">
            {attachment.fileName}
          </span>
          <span className="text-gray-500 font-mono text-[11px] shrink-0">
            ({(attachment.fileSize / 1024).toFixed(1)} KB)
          </span>
          {uploaderName && (
            <span className="text-gray-400 text-[11px] hidden sm:inline truncate">
              Uploaded by{" "}
              <strong className="text-gray-200">{uploaderName}</strong>
            </span>
          )}
          {attachment.localeTag && (
            <span
              className="rounded bg-brand-navy px-2 py-0.5 text-[10px] font-mono text-accent-gold border border-accent-gold/30 uppercase
  shrink-0"
            >
              {attachment.localeTag}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Paired Zoom Buttons */}
          <div
            className="flex items-center space-x-1 rounded-md bg-surface-card border border-border-subtle px-1.5 py-0.5 font-mono text-xs
  text-gray-300"
          >
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-1 rounded hover:text-white hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-
  colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-bold text-accent-gold w-11 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 2.5}
              className="p-1 rounded hover:text-white hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-
  colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <a
            href={attachment.fileUrl}
            download={attachment.fileName}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
            title="Download asset"
          >
            <Download className="h-4 w-4" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image Inspection Canvas */}
      <div
        className={`flex-1 overflow-auto flex items-center justify-center p-6 ${
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
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-transform duration-200 ease-out"
        />
      </div>
    </div>
  );
};

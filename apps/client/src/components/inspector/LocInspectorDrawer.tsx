import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Languages,
  AlertTriangle,
  Search,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import {
  StringStatus,
  type LocStringDTO,
  type GlossaryTermDTO,
} from "@capsloc/types";
import { api } from "../../services/api";
import { StringStatusBadge } from "../ui/StringStatusBadge";

export interface LocInspectorDrawerProps {
  stringKey: string | null;
  onClose: () => void;
  onStatusUpdated?: (updated: LocStringDTO) => void;
}

export const LocInspectorDrawer: React.FC<LocInspectorDrawerProps> = ({
  stringKey,
  onClose,
  onStatusUpdated,
}) => {
  const [stringData, setStringData] = useState<LocStringDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMutatingStatus, setIsMutatingStatus] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Glossary search state
  const [glossaryQuery, setGlossaryQuery] = useState<string>("");
  const [glossaryResults, setGlossaryResults] = useState<GlossaryTermDTO[]>([]);
  const [isSearchingGlossary, setIsSearchingGlossary] =
    useState<boolean>(false);

  // 1. Fetch string metadata on key selection
  useEffect(() => {
    if (!stringKey) {
      setStringData(null);
      return;
    }

    let isMounted = true;
    const fetchStringDetails = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get<LocStringDTO>(
          `/loc-strings/${stringKey}`,
        );
        if (isMounted) {
          setStringData(data);
        }
      } catch (err) {
        console.error("Failed to load string metadata:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStringDetails();
    return () => {
      isMounted = false;
    };
  }, [stringKey]);

  // 2. Debounced Glossary Search
  useEffect(() => {
    const trimmed = glossaryQuery.trim();
    if (!trimmed) {
      setGlossaryResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlossary(true);
      try {
        const { data } = await api.get<GlossaryTermDTO[]>(
          `/glossary/search?q=${encodeURIComponent(trimmed)}`,
        );
        setGlossaryResults(data);
      } catch (err) {
        console.error("Glossary lookup failed:", err);
      } finally {
        setIsSearchingGlossary(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [glossaryQuery]);

  // 3. Status Mutation Handler
  const handleStatusChange = async (newStatus: StringStatus) => {
    if (!stringData || stringData.status === newStatus || isMutatingStatus)
      return;

    setIsMutatingStatus(true);
    try {
      const { data } = await api.patch<LocStringDTO>(
        `/loc-strings/${stringData.stringKey}/status`,
        { status: newStatus },
      );
      setStringData(data);
      onStatusUpdated?.(data);
    } catch (err) {
      console.error("Status update mutation failed:", err);
    } finally {
      setIsMutatingStatus(false);
    }
  };

  const handleCopySource = () => {
    if (!stringData?.sourceText) return;
    navigator.clipboard.writeText(stringData.sourceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stringKey) {
    return (
      <aside className="w-96 border-l border-border-subtle bg-surface-panel flex flex-col h-full shadow-2xl shrink-0 select-text">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border-subtle p-3.5 bg-surface-card/40">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-accent-gold" />
            <span className="font-sans text-xs font-bold text-gray-200">
              String Inspector
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-surface-hover transition-colors cursor-pointer"
            title="Close Inspector Drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
          <BookOpen className="h-8 w-8 text-gray-600 mb-2" />
          <span className="text-xs font-medium text-gray-400">
            No String Selected
          </span>
          <span className="text-[11px] text-gray-500 mt-1 max-w-xs">
            Click any #LOC-XXXX or $STR_XXXX tag in chat to inspect its source,
            character limits, and translation status.
          </span>
        </div>
      </aside>
    );
  }

  // Character Limit Gauge Calculation
  const charLimit = stringData?.charLimit ?? null;
  const currentLength = stringData?.targetText?.length ?? 0;
  const isOverflow = charLimit ? currentLength > charLimit : false;
  const percentUsed = charLimit
    ? Math.min(Math.round((currentLength / charLimit) * 100), 100)
    : 0;

  const gaugeColor = !charLimit
    ? "bg-accent-gold"
    : isOverflow
      ? "bg-rose-500"
      : percentUsed >= 80
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <aside className="w-96 border-l border-border-subtle bg-surface-panel flex flex-col h-full shadow-2xl shrink-0 select-text">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border-subtle p-3.5 bg-surface-card/40">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-accent-gold" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent-gold">
            String Inspector
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
          title="Close Inspector Drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer Body */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center font-mono text-xs text-gray-500 space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-accent-gold" />
          <span>INSPECTING #{stringKey}...</span>
        </div>
      ) : !stringData ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 font-mono text-xs">
          <AlertTriangle className="h-6 w-6 text-status-flagged mb-2" />
          <span>RECORD NOT FOUND FOR #{stringKey}</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Key & Status Ribbon */}
          <div className="rounded border border-border-subtle bg-surface-card p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-gray-500 block">
                  String Identifier
                </span>
                <span className="font-mono text-sm font-bold text-accent-gold">
                  #{stringData.stringKey}
                </span>
              </div>
              <StringStatusBadge status={stringData.status} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50 text-[11px] font-mono text-gray-400">
              <span>PROJECT: {stringData.projectTag}</span>
              <span>LOCALE: {stringData.targetLocale}</span>
            </div>

            {/* Status Mutation Dropdown */}
            <div className="pt-2">
              <label className="text-[10px] font-mono uppercase text-gray-500 block mb-1">
                Update Review Status
              </label>
              <select
                value={stringData.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as StringStatus)
                }
                disabled={isMutatingStatus}
                className="w-full rounded border border-border-subtle bg-surface-panel px-2.5 py-1.5 font-mono text-xs text-gray-200 focus:border-accent-gold/60 focus:outline-none transition-colors"
              >
                <option value={StringStatus.DRAFT}>DRAFT</option>
                <option value={StringStatus.IN_REVIEW}>IN_REVIEW</option>
                <option value={StringStatus.LQA_FLAGGED}>LQA_FLAGGED</option>
                <option value={StringStatus.APPROVED}>APPROVED</option>
              </select>
            </div>
          </div>

          {/* Japanese Source Text Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-gray-400 font-semibold flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-accent-gold" /> Japanese
                Source
              </span>
              <button
                type="button"
                onClick={handleCopySource}
                className="text-[11px] font-mono text-gray-500 hover:text-accent-gold flex items-center gap-1 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="rounded border border-border-subtle bg-surface-card p-3 font-sans text-sm text-gray-100 leading-relaxed select-text">
              {stringData.sourceText}
            </div>
          </div>

          {/* Target Translation & Character Limit Gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-gray-400 font-semibold">
                Target Translation ({stringData.targetLocale})
              </span>
              {charLimit && (
                <span
                  className={`text-[11px] font-mono font-bold ${
                    isOverflow ? "text-rose-400" : "text-gray-400"
                  }`}
                >
                  {currentLength} / {charLimit} CHARS
                </span>
              )}
            </div>

            <div className="rounded border border-border-subtle bg-surface-card p-3 font-sans text-xs text-gray-200 leading-relaxed select-text">
              {stringData.targetText || (
                <span className="italic text-gray-500">
                  Translation pending...
                </span>
              )}
            </div>

            {/* Visual Character Gauge Bar */}
            {charLimit && (
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-surface-panel overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${gaugeColor}`}
                    style={{
                      width: `${Math.min((currentLength / charLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
                {isOverflow && (
                  <p className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    Overflow: +{currentLength - charLimit} chars beyond UI box
                    limit!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Context / Scene Notes */}
          {stringData.contextNotes && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase text-gray-400 font-semibold">
                Context & Scene Notes
              </span>
              <div className="rounded border border-border-subtle bg-surface-card/60 p-2.5 text-xs text-gray-300 font-mono text-[11px] leading-normal">
                {stringData.contextNotes}
              </div>
            </div>
          )}

          {/* Canonical Glossary Term Search Engine */}
          <div className="pt-2 border-t border-border-subtle space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-gray-400 font-semibold flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-accent-gold" /> Capcom
                Glossary Codex
              </span>
              {isSearchingGlossary && (
                <Loader2 className="h-3 w-3 animate-spin text-accent-gold" />
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={glossaryQuery}
                onChange={(e) => setGlossaryQuery(e.target.value)}
                placeholder="Search canonical terms (e.g. demon, rath)..."
                className="w-full rounded border border-border-subtle bg-surface-card px-2.5 py-1.5 text-xs font-mono text-gray-200 placeholder-gray-500 focus:border-accent-gold/50 focus:outline-none"
              />
            </div>

            {/* Glossary Match Results */}
            {glossaryResults.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {glossaryResults.map((term) => (
                  <div
                    key={term.id}
                    className="rounded border border-border-subtle bg-surface-card p-2 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-accent-gold font-bold">
                        {term.targetEn}
                      </span>
                      <span className="rounded bg-brand-navy px-1.5 py-0.5 text-[9px] font-mono text-accent-gold border border-accent-gold/20 uppercase">
                        {term.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-sans">
                      Source: {term.sourceJa}
                    </div>
                    {term.notes && (
                      <div className="text-[10px] text-gray-500 font-mono italic">
                        {term.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

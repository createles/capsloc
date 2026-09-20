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
  ChevronDown,
} from "lucide-react";
import { StringStatus, type LocStringDTO, type GlossaryTermDTO } from "@capsloc/types";
import { api } from "../../services/api";
import { StringStatusBadge } from "../ui/StringStatusBadge";

const GlossaryTermCard: React.FC<{ term: GlossaryTermDTO }> = ({ term }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasLongNotes = Boolean(term.notes && term.notes.length > 50);

  return (
    <div className="space-y-1.5 rounded border border-border-subtle bg-surface-card p-2.5 text-xs transition-colors hover:border-border-subtle/80">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-accent-gold">{term.targetEn}</span>
        <span className="rounded border border-accent-gold/20 bg-brand-navy px-1.5 py-0.5 font-mono text-[9px] font-semibold text-accent-gold uppercase">
          {term.category}
        </span>
      </div>
      <div className="font-sans text-[11px] text-gray-400">
        Source: <span className="font-medium text-gray-200">{term.sourceJa}</span>
      </div>
      {term.notes && (
        <div className="pt-1">
          {isExpanded ? (
            <div className="rounded border border-border-subtle/60 bg-surface-panel/80 p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-gray-300 select-text">
              {term.notes}
            </div>
          ) : (
            <p className="line-clamp-2 font-mono text-[10px] leading-normal text-gray-400 italic">
              {term.notes}
            </p>
          )}

          {hasLongNotes && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 flex cursor-pointer items-center space-x-1 font-mono text-[10px] text-accent-gold/80 transition-colors hover:text-accent-gold"
            >
              <span>{isExpanded ? "Show less" : "Show guidelines & notes"}</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export interface LocInspectorDrawerProps {
  stringKey: string | null;
  onClose: () => void;
  onStatusUpdated?: (updated: LocStringDTO) => void;
  mentionsCountInCurrentChat?: number;
  isTagHighlightActive?: boolean;
  onToggleTagHighlight?: (stringKey: string) => void;
}

export type InspectorTab = "INSPECTOR" | "GLOSSARY";

export const LocInspectorDrawer: React.FC<LocInspectorDrawerProps> = ({
  stringKey,
  onClose,
  onStatusUpdated,
  mentionsCountInCurrentChat = 0,
  isTagHighlightActive = false,
  onToggleTagHighlight,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>("INSPECTOR");
  const [stringData, setStringData] = useState<LocStringDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMutatingStatus, setIsMutatingStatus] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Glossary search state
  const [glossaryQuery, setGlossaryQuery] = useState<string>("");
  const [glossaryResults, setGlossaryResults] = useState<GlossaryTermDTO[]>([]);
  const [isSearchingGlossary, setIsSearchingGlossary] = useState<boolean>(false);

  // Reset loc-string metadata and switch to INSPECTOR tab during render when stringKey changes:
  const [prevStringKey, setPrevStringKey] = useState(stringKey);
  if (stringKey !== prevStringKey) {
    setPrevStringKey(stringKey);
    setStringData(null);
    if (stringKey) {
      setActiveTab("INSPECTOR");
    }
  }

  // Load initial glossary catalog
  useEffect(() => {
    let isMounted = true;
    const fetchInitialGlossary = async () => {
      try {
        const { data } = await api.get<GlossaryTermDTO[]>("/glossary");
        if (isMounted) setGlossaryResults(data);
      } catch (err) {
        console.error("Failed to load initial glossary:", err);
      }
    };
    fetchInitialGlossary();
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Fetch string metadata on key selection
  useEffect(() => {
    if (!stringKey) {
      return;
    }

    let isMounted = true;
    const fetchStringDetails = async () => {
      setStringData(null);
      setIsLoading(true);
      try {
        const { data } = await api.get<LocStringDTO>(`/loc-strings/${stringKey}`);
        if (isMounted) {
          setStringData(data);
        }
      } catch (err) {
        console.error("Failed to load string metadata:", err);
        if (isMounted) {
          setStringData(null);
        }
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
      // Reload full glossary when search query is cleared
      api
        .get<GlossaryTermDTO[]>("/glossary")
        .then(({ data }) => setGlossaryResults(data))
        .catch(console.error);
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
    }, 250);

    return () => clearTimeout(timer);
  }, [glossaryQuery]);

  // 3. Status Mutation Handler
  const handleStatusChange = async (newStatus: StringStatus) => {
    if (!stringData || stringData.status === newStatus || isMutatingStatus) return;

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

  // Character Limit Gauge Calculation
  const charLimit = stringData?.charLimit ?? null;
  const currentLength = stringData?.targetText?.length ?? 0;
  const isOverflow = charLimit ? currentLength > charLimit : false;
  const percentUsed = charLimit ? Math.min(Math.round((currentLength / charLimit) * 100), 100) : 0;

  const gaugeColor = !charLimit
    ? "bg-accent-gold"
    : isOverflow
      ? "bg-rose-500"
      : percentUsed >= 80
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col border-l border-border-subtle bg-surface-panel shadow-2xl select-text">
      {/* Header Bar with Modern Frosted Glass */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-panel/90 px-4 backdrop-blur-md select-none">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-accent-gold" />
          <span className="font-sans text-xs font-bold tracking-tight text-white">
            Studio Codex
          </span>
          <span className="py-0.2 rounded-md border border-border-subtle bg-surface-card px-1.5 font-mono text-[9px] text-slate-400">
            LQA Tools
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-surface-hover hover:text-white"
          title="Close Inspector Drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="shrink-0 p-3 pb-0">
        <div className="flex items-center rounded-xl border border-white/[0.06] bg-surface-canvas p-1">
          <button
            type="button"
            onClick={() => setActiveTab("INSPECTOR")}
            className={`flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              activeTab === "INSPECTOR"
                ? "border-white/10 bg-surface-card text-white shadow-xs"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Languages className="h-3.5 w-3.5 text-accent-gold" />
            <span>String Inspector</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("GLOSSARY")}
            className={`flex flex-1 cursor-pointer items-center justify-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              activeTab === "GLOSSARY"
                ? "border-white/10 bg-surface-card text-white shadow-xs"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-accent-gold" />
            <span>Glossary Codex</span>
          </button>
        </div>
      </div>

      {/* Tab 1: String Inspector View */}
      {activeTab === "INSPECTOR" ? (
        !stringKey ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-slate-500">
            <Languages className="mb-2 h-8 w-8 text-slate-600" />
            <span className="text-xs font-medium text-slate-400">No String Selected</span>
            <span className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-500">
              Click any <code className="font-mono font-bold text-emerald-400">#LOC-XXXX</code> or{" "}
              <code className="font-mono font-bold text-emerald-400">$STR_XXXX</code> tag in chat to
              inspect its Japanese source, character limit gauge, and workflow review status.
            </span>
          </div>
        ) : isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-2 font-mono text-xs text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-accent-gold" />
            <span>INSPECTING #{stringKey}...</span>
          </div>
        ) : !stringData ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center font-mono text-xs text-slate-500">
            <AlertTriangle className="mb-2 h-6 w-6 text-status-flagged" />
            <span>RECORD NOT FOUND FOR #{stringKey}</span>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {/* Key & Status Ribbon Card */}
            <div className="space-y-2.5 rounded-xl border border-border-subtle bg-surface-card/60 p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-mono text-[10px] tracking-wider text-slate-500 uppercase">
                    String Identifier
                  </span>
                  <span className="font-mono text-sm font-bold text-accent-gold">
                    #{stringData.stringKey}
                  </span>
                </div>
                <StringStatusBadge status={stringData.status} />
              </div>

              <div className="flex items-center justify-between border-t border-border-subtle/50 pt-2 font-mono text-[11px] text-slate-400">
                <span>PROJECT: {stringData.projectTag}</span>
                <span>LOCALE: {stringData.targetLocale}</span>
              </div>

              {/* Status Mutation Dropdown */}
              <div className="pt-2">
                <label className="mb-1 block font-mono text-[10px] tracking-wider text-slate-500 uppercase">
                  Review Workflow Status
                </label>
                <div className="relative">
                  <select
                    value={stringData.status}
                    onChange={(e) => handleStatusChange(e.target.value as StringStatus)}
                    disabled={isMutatingStatus}
                    className="w-full cursor-pointer appearance-none rounded-lg border border-border-subtle bg-surface-panel py-1.5 pr-8 pl-2.5 font-mono text-xs text-slate-200 transition-colors focus:border-accent-gold/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value={StringStatus.DRAFT}>DRAFT</option>
                    <option value={StringStatus.IN_REVIEW}>IN_REVIEW</option>
                    <option value={StringStatus.LQA_FLAGGED}>LQA_FLAGGED</option>
                    <option value={StringStatus.APPROVED}>APPROVED</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Japanese Source Text Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-400 uppercase">
                  <Languages className="h-3.5 w-3.5 text-accent-gold" /> Japanese Source
                </span>
                <button
                  type="button"
                  onClick={handleCopySource}
                  className="flex cursor-pointer items-center gap-1 font-mono text-[11px] text-slate-400 transition-colors hover:text-accent-gold"
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
              <div className="rounded-xl border border-border-subtle bg-surface-card/60 p-3 font-sans text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-100 shadow-xs select-text">
                {stringData.sourceText}
              </div>
            </div>

            {/* Target Translation & Character Limit Gauge */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold text-slate-400 uppercase">
                  Target Translation ({stringData.targetLocale})
                </span>
                {charLimit && (
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      isOverflow ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    {currentLength} / {charLimit} CHARS
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-card/60 p-3 font-sans text-xs leading-relaxed break-words whitespace-pre-wrap text-slate-200 shadow-xs select-text">
                {stringData.targetText || (
                  <span className="text-slate-500 italic">Translation pending...</span>
                )}
              </div>

              {/* Visual Character Gauge Bar */}
              {charLimit && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-panel">
                    <div
                      className={`h-full transition-all duration-300 ${gaugeColor}`}
                      style={{
                        width: `${Math.min((currentLength / charLimit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  {isOverflow && (
                    <p className="flex items-center gap-1 font-mono text-[10px] text-rose-400">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Overflow: +{currentLength - charLimit} chars beyond UI box limit!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Context / Scene Notes */}
            {stringData.contextNotes && (
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] font-semibold text-slate-400 uppercase">
                  Context & Scene Notes
                </span>
                <div className="rounded-xl border border-border-subtle bg-surface-card/40 p-2.5 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap text-slate-300 select-text">
                  {stringData.contextNotes}
                </div>
              </div>
            )}

            {/* Channel Mentions Highlight Trigger */}
            <div className="space-y-1.5 border-t border-border-subtle/50 pt-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-400 uppercase">
                  <Search className="h-3.5 w-3.5 text-accent-gold" /> Channel Mentions
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {mentionsCountInCurrentChat ?? 0} in this channel
                </span>
              </div>

              <button
                type="button"
                disabled={(mentionsCountInCurrentChat ?? 0) === 0}
                onClick={() => onToggleTagHighlight?.(stringData.stringKey)}
                title={
                  (mentionsCountInCurrentChat ?? 0) === 0
                    ? "No mentions found in this channel"
                    : isTagHighlightActive
                      ? "Untoggle in-chat highlight"
                      : "Highlight mentions in chat stream"
                }
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-mono text-xs transition-all ${
                  (mentionsCountInCurrentChat ?? 0) === 0
                    ? "cursor-not-allowed border border-border-subtle/60 bg-surface-card text-slate-500 opacity-40"
                    : isTagHighlightActive
                      ? "cursor-pointer bg-accent-gold font-bold text-slate-950 shadow-xs hover:bg-amber-400"
                      : "cursor-pointer border border-border-subtle bg-surface-card text-slate-200 hover:border-accent-gold/40 hover:bg-surface-hover"
                }`}
              >
                <span className="text-[11px]">
                  {(mentionsCountInCurrentChat ?? 0) > 0
                    ? `${mentionsCountInCurrentChat} ${
                        mentionsCountInCurrentChat === 1 ? "Match" : "Matches"
                      } in Channel`
                    : "No Matches in Channel"}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                    (mentionsCountInCurrentChat ?? 0) === 0
                      ? "border border-border-subtle bg-surface-panel text-slate-500"
                      : isTagHighlightActive
                        ? "bg-black/20 font-bold text-slate-950"
                        : "border border-accent-gold/30 bg-brand-navy text-accent-gold"
                  }`}
                >
                  {isTagHighlightActive ? "Highlighted" : "Highlight"}
                </span>
              </button>
            </div>
          </div>
        )
      ) : (
        /* Tab 2: Glossary Codex View */
        <div className="flex flex-1 flex-col space-y-3 overflow-hidden p-4">
          <div className="relative shrink-0">
            <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={glossaryQuery}
              onChange={(e) => setGlossaryQuery(e.target.value)}
              placeholder="Search terms (e.g. Demondrug, Lockpick)..."
              className="w-full rounded-lg border border-border-subtle bg-surface-card py-2 pr-8 pl-8.5 font-sans text-xs text-slate-200 placeholder-slate-500 transition-all focus:border-accent-gold/50 focus:bg-surface-card focus:ring-1 focus:ring-accent-gold/20 focus:outline-none"
            />
            {isSearchingGlossary ? (
              <Loader2 className="absolute top-2.5 right-3 h-3.5 w-3.5 animate-spin text-accent-gold" />
            ) : (
              glossaryQuery && (
                <button
                  type="button"
                  onClick={() => setGlossaryQuery("")}
                  className="absolute top-2.5 right-3 cursor-pointer text-slate-500 hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {glossaryResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <BookOpen className="mb-2 h-7 w-7 text-slate-600" />
                <span className="text-xs font-medium text-slate-400">No Canonical Terms Found</span>
                <span className="mt-1 text-[11px] text-slate-500">
                  {glossaryQuery
                    ? `No entries match "${glossaryQuery}"`
                    : "No glossary records loaded"}
                </span>
              </div>
            ) : (
              glossaryResults.map((term) => <GlossaryTermCard key={term.id} term={term} />)
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

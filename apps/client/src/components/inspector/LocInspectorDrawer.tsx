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
import { useTranslation } from "../../i18n";
import { StringStatusBadge } from "../ui/StringStatusBadge";
import { Skeleton } from "../ui/Skeleton";

const EMPTY_GLOSSARY_RESULTS: GlossaryTermDTO[] = [];

const GlossaryTermCard: React.FC<{ term: GlossaryTermDTO }> = ({ term }) => {
  const { t } = useTranslation();
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
        {t("inspector.source")} <span className="font-medium text-gray-200">{term.sourceJa}</span>
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
              <span>{isExpanded ? t("inspector.showLess") : t("inspector.showGuidelines")}</span>
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
  onClearStringKey?: () => void;
  onClose: () => void;
  onStatusUpdated?: (updated: LocStringDTO) => void;
  mentionsCountInCurrentChat?: number;
  isTagHighlightActive?: boolean;
  onToggleTagHighlight?: (stringKey: string) => void;
  projectTag?: string | null;
  channelName?: string | null;
}

export type InspectorTab = "INSPECTOR" | "GLOSSARY";

export const LocInspectorDrawer: React.FC<LocInspectorDrawerProps> = ({
  stringKey,
  onClearStringKey,
  onClose,
  onStatusUpdated,
  mentionsCountInCurrentChat = 0,
  isTagHighlightActive = false,
  onToggleTagHighlight,
  projectTag,
  channelName,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<InspectorTab>("INSPECTOR");
  const [stringData, setStringData] = useState<LocStringDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMutatingStatus, setIsMutatingStatus] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Glossary search state
  const [glossaryQuery, setGlossaryQuery] = useState<string>("");
  const [glossaryResults, setGlossaryResults] = useState<GlossaryTermDTO[]>([]);
  const [isSearchingGlossary, setIsSearchingGlossary] = useState<boolean>(false);

  // Resolve active project context with generic slug extraction on channel name
  const effectiveProjectTag = React.useMemo(() => {
    if (projectTag && projectTag.trim().toUpperCase() !== "GLOBAL") {
      return projectTag.trim();
    }
    if (channelName) {
      // Strip common taxonomy prefixes (loc-, proj-, channel-, ch-) and extract first slug token
      const slug = channelName.replace(/^(?:loc|proj|channel|ch)[-_]/i, "");
      const token = slug.split(/[-_]/)[0];
      if (token && token.length >= 2) {
        return token.toUpperCase();
      }
    }
    return null;
  }, [projectTag, channelName]);

  // Derived idle state: when no search query and no project context, yield empty results without triggering cascading effects
  const isIdleWithoutProject = !glossaryQuery.trim() && !effectiveProjectTag;
  const activeGlossaryResults = isIdleWithoutProject ? EMPTY_GLOSSARY_RESULTS : glossaryResults;

  // Detected glossary terms within current inspected string
  const detectedTerms = React.useMemo(() => {
    if (!stringData) return [];
    return activeGlossaryResults.filter((term) => {
      const inJa = stringData.sourceText?.includes(term.sourceJa);
      const inEn =
        term.targetEn && stringData.targetText?.toLowerCase().includes(term.targetEn.toLowerCase());
      return Boolean(inJa || inEn);
    });
  }, [stringData, activeGlossaryResults]);

  const nonDetectedTerms = React.useMemo(() => {
    if (detectedTerms.length === 0) return activeGlossaryResults;
    const detectedIds = new Set(detectedTerms.map((t) => t.id));
    return activeGlossaryResults.filter((t) => !detectedIds.has(t.id));
  }, [detectedTerms, activeGlossaryResults]);

  const [prevStringKey, setPrevStringKey] = useState(stringKey);

  if (stringKey !== prevStringKey) {
    setPrevStringKey(stringKey);
    setStringData(null);
    if (stringKey) {
      setActiveTab("INSPECTOR");
    }
  }

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

  useEffect(() => {
    const trimmed = glossaryQuery.trim();
    if (!trimmed) {
      // Idle without active project: early exit (activeGlossaryResults derived as [])
      if (!effectiveProjectTag) {
        return;
      }

      let isMounted = true;
      api
        .get<GlossaryTermDTO[]>("/glossary/suggestions", {
          params: { projectTag: effectiveProjectTag, limit: 15 },
        })
        .then(({ data }) => {
          if (isMounted) setGlossaryResults(data);
        })
        .catch((err) => console.error("Failed to load glossary suggestions:", err));
      return () => {
        isMounted = false;
      };
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlossary(true);
      try {
        const { data } = await api.get<GlossaryTermDTO[]>("/glossary/search", {
          params: { q: trimmed },
        });
        setGlossaryResults(data);
      } catch (err) {
        console.error("Glossary lookup failed:", err);
      } finally {
        setIsSearchingGlossary(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [glossaryQuery, effectiveProjectTag]);

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
    <aside className="drawer-slide-in flex h-full w-96 shrink-0 flex-col border-l border-border-subtle bg-surface-panel shadow-2xl select-text">
      {/* Header Bar with Modern Frosted Glass */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-panel/90 px-4 backdrop-blur-md select-none">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-accent-gold" />
          <span className="font-sans text-xs font-bold tracking-tight text-white">
            {t("inspector.title")}
          </span>
          <span className="py-0.2 rounded-md border border-border-subtle bg-surface-card px-1.5 font-mono text-[9px] text-slate-400">
            {t("inspector.badge")}
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
            <span>{t("inspector.tabInspector")}</span>
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
            <span>{t("inspector.tabGlossary")}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: String Inspector View */}
      {activeTab === "INSPECTOR" ? (
        !stringKey ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center select-none">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-surface-card text-accent-gold shadow-sm">
              <Languages className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              {t("inspector.noStringSelected")}
            </span>
            <span className="mt-1.5 max-w-xs text-[11px] leading-relaxed text-slate-400">
              {t("inspector.noStringHelp")}
            </span>
          </div>
        ) : isLoading ? (
          <div className="flex-1 space-y-4 overflow-y-auto p-4 select-none">
            {/* Key & Status Ribbon Skeleton */}
            <div className="space-y-2.5 rounded-xl border border-border-subtle bg-surface-card/60 p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-20 rounded" />
                  <Skeleton className="h-4 w-32 rounded" />
                </div>
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <div className="flex items-center justify-between border-t border-border-subtle/50 pt-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>

            {/* Gauge Skeleton */}
            <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-card/60 p-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>

            {/* Source Text Skeleton */}
            <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-card/60 p-3">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>

            {/* Target Text Skeleton */}
            <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-card/60 p-3">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>

            {/* Context Notes Skeleton */}
            <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-card/60 p-3">
              <Skeleton className="h-3 w-36 rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ) : !stringData ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center font-mono text-xs text-slate-500">
            <AlertTriangle className="mb-2 h-6 w-6 text-status-flagged" />
            <span>
              {t("inspector.notFound")} #{stringKey}
            </span>
            {onClearStringKey && (
              <button
                type="button"
                onClick={onClearStringKey}
                className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-card px-2.5 py-1 text-[11px] text-slate-300 transition-colors hover:border-accent-gold/40 hover:text-accent-gold"
                title={t("inspector.clearString")}
              >
                <X className="h-3.5 w-3.5" />
                <span>{t("inspector.clearString")}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {/* Key & Status Ribbon Card */}
            <div className="space-y-2.5 rounded-xl border border-border-subtle bg-surface-card/60 p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-mono text-[10px] tracking-wider text-slate-500 uppercase">
                    {t("inspector.stringIdentifier")}
                  </span>
                  <span className="font-mono text-sm font-bold text-accent-gold">
                    #{stringData.stringKey}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StringStatusBadge status={stringData.status} />
                  {onClearStringKey && (
                    <button
                      type="button"
                      onClick={onClearStringKey}
                      className="flex cursor-pointer items-center gap-1 rounded-md border border-border-subtle bg-surface-panel/80 px-2 py-1 font-mono text-[10px] text-slate-400 transition-colors hover:border-rose-500/40 hover:bg-surface-card hover:text-rose-300"
                      title={t("inspector.clearString")}
                    >
                      <X className="h-3 w-3" />
                      <span>{t("inspector.clear")}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-subtle/50 pt-2 font-mono text-[11px] text-slate-400">
                <span>
                  {t("inspector.project")} {stringData.projectTag}
                </span>
                <span>
                  {t("inspector.locale")} {stringData.targetLocale}
                </span>
              </div>

              {/* Status Mutation Dropdown */}
              <div className="pt-2">
                <label className="mb-1 block font-mono text-[10px] tracking-wider text-slate-500 uppercase">
                  {t("inspector.workflowStatus")}
                </label>
                <div className="relative">
                  <select
                    value={stringData.status}
                    onChange={(e) => handleStatusChange(e.target.value as StringStatus)}
                    disabled={isMutatingStatus}
                    className="w-full cursor-pointer appearance-none rounded-lg border border-border-subtle bg-surface-panel py-1.5 pr-8 pl-2.5 font-mono text-xs text-slate-200 transition-colors focus:border-accent-gold/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value={StringStatus.DRAFT}>{t("StringStatus.DRAFT")}</option>
                    <option value={StringStatus.IN_REVIEW}>{t("StringStatus.IN_REVIEW")}</option>
                    <option value={StringStatus.LQA_FLAGGED}>
                      {t("StringStatus.LQA_FLAGGED")}
                    </option>
                    <option value={StringStatus.APPROVED}>{t("StringStatus.APPROVED")}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Japanese Source Text Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-400 uppercase">
                  <Languages className="h-3.5 w-3.5 text-accent-gold" /> {t("inspector.sourceText")}
                </span>
                <button
                  type="button"
                  onClick={handleCopySource}
                  className="flex cursor-pointer items-center gap-1 font-mono text-[11px] text-slate-400 transition-colors hover:text-accent-gold"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" /> {t("inspector.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> {t("inspector.copy")}
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
                  {t("inspector.targetTranslation")} ({stringData.targetLocale})
                </span>
                {charLimit && (
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      isOverflow ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    {currentLength} / {charLimit} {t("inspector.chars")}
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-card/60 p-3 font-sans text-xs leading-relaxed break-words whitespace-pre-wrap text-slate-200 shadow-xs select-text">
                {stringData.targetText || (
                  <span className="text-slate-500 italic">{t("inspector.translationPending")}</span>
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
                      {t("inspector.overflowWarning", { count: currentLength - charLimit })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Context / Scene Notes */}
            {stringData.contextNotes && (
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] font-semibold text-slate-400 uppercase">
                  {t("inspector.contextNotes")}
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
                  <Search className="h-3.5 w-3.5 text-accent-gold" />{" "}
                  {t("inspector.channelMentions")}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {t("inspector.inChannelCount", { count: mentionsCountInCurrentChat ?? 0 })}
                </span>
              </div>

              <button
                type="button"
                disabled={(mentionsCountInCurrentChat ?? 0) === 0}
                onClick={() => onToggleTagHighlight?.(stringData.stringKey)}
                title={
                  (mentionsCountInCurrentChat ?? 0) === 0
                    ? t("inspector.noMatches")
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
                    ? mentionsCountInCurrentChat === 1
                      ? t("inspector.matchInChannel")
                      : t("inspector.matchesInChannel", { count: mentionsCountInCurrentChat })
                    : t("inspector.noMatches")}
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
                  {isTagHighlightActive ? t("inspector.highlighted") : t("inspector.highlight")}
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
              placeholder={t("inspector.glossarySearchPlaceholder")}
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

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {activeGlossaryResults.length === 0 ? (
              isSearchingGlossary ? (
                <div className="space-y-2 py-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="space-y-2 rounded-lg border border-border-subtle/50 bg-surface-card/60 p-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-3.5 w-16 rounded bg-brand-navy/60" />
                      </div>
                      <Skeleton className="h-3 w-36 rounded bg-surface-card/80" />
                      <Skeleton className="h-2.5 w-full rounded bg-surface-card/50" />
                    </div>
                  ))}
                </div>
              ) : glossaryQuery.trim() ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <BookOpen className="mb-2 h-7 w-7 text-slate-600" />
                  <span className="text-xs font-medium text-slate-400">
                    {t("inspector.noTermsFound")}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    {t("inspector.noEntriesMatch", { query: glossaryQuery })}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center select-none">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-surface-card text-accent-gold shadow-sm">
                    <Search className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {t("inspector.searchTermsTitle")}
                  </span>
                  <span className="mt-1.5 max-w-xs text-[11px] leading-relaxed text-slate-400">
                    {t("inspector.searchTermsPrompt")}
                  </span>
                </div>
              )
            ) : (
              <>
                {/* 1. Terms Detected in Currently Inspected String */}
                {detectedTerms.length > 0 && (
                  <div className="space-y-1.5 rounded-lg border border-accent-gold/40 bg-brand-navy/30 p-2.5">
                    <div className="flex items-center space-x-1.5 font-mono text-[10px] font-bold tracking-wider text-accent-gold uppercase">
                      <Languages className="h-3.5 w-3.5 text-accent-gold" />
                      <span>
                        {t("inspector.detectedTerms")} ({detectedTerms.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {detectedTerms.map((term) => (
                        <GlossaryTermCard key={`detected-${term.id}`} term={term} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Project Suggestions or Search Query Results */}
                {nonDetectedTerms.length > 0 && (
                  <div className="space-y-2">
                    {!glossaryQuery && effectiveProjectTag && (
                      <div className="font-mono text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                        {t("inspector.projectSuggestions")} ({effectiveProjectTag})
                      </div>
                    )}
                    {nonDetectedTerms.map((term) => (
                      <GlossaryTermCard key={term.id} term={term} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

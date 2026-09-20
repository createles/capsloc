import React from "react";
import { StringStatus } from "@capsloc/types";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../i18n";

export interface StringStatusBadgeProps {
  status: StringStatus;
  className?: string;
  showDot?: boolean;
}

const STATUS_STYLES: Record<StringStatus, { badgeStyle: string; dotStyle: string }> = {
  [StringStatus.APPROVED]: {
    badgeStyle: "bg-status-approved/15 text-status-approved border-status-approved/30",
    dotStyle: "bg-status-approved",
  },
  [StringStatus.IN_REVIEW]: {
    badgeStyle: "bg-status-review/15 text-status-review border-status-review/30",
    dotStyle: "bg-status-review",
  },
  [StringStatus.LQA_FLAGGED]: {
    badgeStyle: "bg-status-flagged/15 text-status-flagged border-status-flagged/30 animate-pulse",
    dotStyle: "bg-status-flagged",
  },
  [StringStatus.DRAFT]: {
    badgeStyle: "bg-status-draft/15 text-status-draft border-status-draft/30",
    dotStyle: "bg-status-draft",
  },
};

export const StringStatusBadge: React.FC<StringStatusBadgeProps> = ({
  status,
  className,
  showDot = true,
}) => {
  const { t } = useTranslation();
  const meta = STATUS_STYLES[status] ?? STATUS_STYLES[StringStatus.DRAFT];
  const key = `StringStatus.${status}` as const;
  const label = t(key);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase",
        meta.badgeStyle,
        className,
      )}
    >
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotStyle)} />}
      {label}
    </span>
  );
};

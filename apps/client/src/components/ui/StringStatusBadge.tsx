import React from "react";
import { StringStatus } from "@capsloc/types";
import { cn } from "../../lib/utils";

export interface StringStatusBadgeProps {
  status: StringStatus;
  className?: string;
  showDot?: boolean;
}

const STATUS_CONFIG: Record<
  StringStatus,
  { label: string; badgeStyle: string; dotStyle: string }
> = {
  [StringStatus.APPROVED]: {
    label: "Approved",
    badgeStyle:
      "bg-status-approved/15 text-status-approved border-status-approved/30",
    dotStyle: "bg-status-approved",
  },
  [StringStatus.IN_REVIEW]: {
    label: "In Review",
    badgeStyle:
      "bg-status-review/15 text-status-review border-status-review/30",
    dotStyle: "bg-status-review",
  },
  [StringStatus.LQA_FLAGGED]: {
    label: "LQA Flagged",
    badgeStyle:
      "bg-status-flagged/15 text-status-flagged border-status-flagged/30 animate-pulse",
    dotStyle: "bg-status-flagged",
  },
  [StringStatus.DRAFT]: {
    label: "Draft",
    badgeStyle: "bg-status-draft/15 text-status-draft border-status-draft/30",
    dotStyle: "bg-status-draft",
  },
};

export const StringStatusBadge: React.FC<StringStatusBadgeProps> = ({
  status,
  className,
  showDot = true,
}) => {
  const meta = STATUS_CONFIG[status] ?? STATUS_CONFIG[StringStatus.DRAFT];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold",
        meta.badgeStyle,
        className,
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotStyle)} />
      )}
      {meta.label}
    </span>
  );
};

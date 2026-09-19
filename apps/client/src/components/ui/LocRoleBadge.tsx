import React from "react";
import { LocRole } from "@capsloc/types";
import { cn } from "../../lib/utils";

export interface LocRoleBadgeProps {
  role: LocRole;
  className?: string;
}

const ROLE_STYLES: Record<LocRole, { label: string; style: string }> = {
  [LocRole.TRANSLATOR]: {
    label: "Translator",
    style: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  },
  [LocRole.LQA_TESTER]: {
    label: "LQA Tester",
    style: "bg-orange-500/10 text-orange-400 border-orange-500/25",
  },
  [LocRole.SOLUTIONS_DEV]: {
    label: "Solutions Dev",
    style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  },
  [LocRole.LOC_PM]: {
    label: "Loc PM",
    style: "bg-purple-500/10 text-purple-400 border-purple-500/25",
  },
  [LocRole.AUDIO_SPECIALIST]: {
    label: "Audio Spec",
    style: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  },
  [LocRole.GENERAL_USER]: {
    label: "Member",
    style: "bg-gray-500/10 text-gray-400 border-gray-500/25",
  },
};

export const LocRoleBadge: React.FC<LocRoleBadgeProps> = ({ role, className }) => {
  const meta = ROLE_STYLES[role] ?? ROLE_STYLES[LocRole.GENERAL_USER];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-semibold whitespace-nowrap shrink-0",
        meta.style,
        className,
      )}
    >
      {meta.label}
    </span>
  );
};

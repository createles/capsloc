import React from "react";
import { LocRole } from "@capsloc/types";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../i18n";

export interface LocRoleBadgeProps {
  role: LocRole;
  className?: string;
}

const ROLE_STYLES: Record<LocRole, string> = {
  [LocRole.TRANSLATOR]: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  [LocRole.LQA_TESTER]: "bg-orange-500/10 text-orange-400 border-orange-500/25",
  [LocRole.SOLUTIONS_DEV]: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  [LocRole.LOC_PM]: "bg-purple-500/10 text-purple-400 border-purple-500/25",
  [LocRole.AUDIO_SPECIALIST]: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  [LocRole.GENERAL_USER]: "bg-gray-500/10 text-gray-400 border-gray-500/25",
};

export const LocRoleBadge: React.FC<LocRoleBadgeProps> = ({ role, className }) => {
  const { t } = useTranslation();
  const style = ROLE_STYLES[role] ?? ROLE_STYLES[LocRole.GENERAL_USER];
  const key = `LocRole.${role}` as const;
  const label = t(key);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider whitespace-nowrap uppercase",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
};

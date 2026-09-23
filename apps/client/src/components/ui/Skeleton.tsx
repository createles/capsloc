import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`skeleton-shimmer rounded-md border border-white/[0.04] ${className}`}
      {...props}
    />
  );
};

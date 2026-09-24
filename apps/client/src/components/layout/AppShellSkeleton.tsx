import React from "react";
import { Skeleton } from "../ui/Skeleton";

export const AppShellSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen w-screen flex-col bg-surface-canvas text-slate-200 select-none">
      {/* 1. Header Skeleton */}
      <header className="z-20 flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-panel/90 px-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-7 w-7 rounded-lg border-accent-gold/20 bg-brand-navy/60" />
          <div className="flex items-baseline space-x-2">
            <Skeleton className="h-4 w-18 rounded" />
            <Skeleton className="h-3 w-32 rounded bg-surface-card/60" />
          </div>
          <Skeleton className="h-4 w-12 rounded-md bg-surface-card" />
        </div>
        <div className="flex items-center space-x-3.5">
          <Skeleton className="h-6 w-14 rounded-lg bg-surface-card" />
          <Skeleton className="h-2 w-2 rounded-full bg-emerald-500/50" />
          <Skeleton className="h-7 w-20 rounded-lg bg-surface-card" />
        </div>
      </header>

      {/* 2. Main Three-Pane Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* [LEFT] Channel Sidebar Skeleton */}
        <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-border-subtle bg-surface-panel p-3">
          <div className="space-y-4">
            {/* Search filter placeholder */}
            <Skeleton className="h-8 w-full rounded-lg bg-surface-canvas/80" />

            {/* Project Channels Section */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-1">
                <Skeleton className="h-3 w-28 rounded bg-surface-card/80" />
                <Skeleton className="h-4 w-4 rounded bg-surface-card/60" />
              </div>
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-7 w-full rounded-lg bg-surface-card/70" />
                <Skeleton className="h-7 w-full rounded-lg bg-surface-card/50" />
                <Skeleton className="h-7 w-full rounded-lg bg-surface-card/40" />
                <Skeleton className="h-7 w-full rounded-lg bg-surface-card/40" />
              </div>
            </div>

            {/* Direct Messages Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between px-1">
                <Skeleton className="h-3 w-24 rounded bg-surface-card/80" />
                <Skeleton className="h-4 w-4 rounded bg-surface-card/60" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center space-x-2 rounded-lg p-1.5">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3.5 w-28 rounded" />
                </div>
                <div className="flex items-center space-x-2 rounded-lg p-1.5">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
                <div className="flex items-center space-x-2 rounded-lg p-1.5">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3.5 w-30 rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* User status card at bottom */}
          <div className="rounded-xl border border-border-subtle/40 bg-surface-card/60 p-2.5">
            <div className="flex items-center space-x-2.5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-2.5 w-16 rounded bg-surface-card/60" />
              </div>
            </div>
          </div>
        </aside>

        {/* [CENTER] Chat Pane Skeleton */}
        <main className="flex flex-1 flex-col bg-surface-canvas">
          {/* Chat Header */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-panel/60 px-4">
            <div className="flex items-center space-x-2.5">
              <Skeleton className="h-4 w-4 rounded bg-accent-gold/30" />
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-5 w-16 rounded-md bg-surface-card" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-16 rounded-md bg-surface-card" />
              <Skeleton className="h-6 w-20 rounded-md bg-surface-card" />
              <Skeleton className="h-6 w-16 rounded-md bg-surface-card" />
            </div>
          </div>

          {/* Message Feed Skeleton */}
          <div className="flex flex-1 flex-col justify-end space-y-4 p-4 pb-6">
            {[
              { w1: "w-64", w2: "w-96", hasSecondLine: true },
              { w1: "w-48", w2: "w-80", hasSecondLine: false },
              { w1: "w-56", w2: "w-full max-w-md", hasSecondLine: true },
              { w1: "w-40", w2: "w-72", hasSecondLine: true },
              { w1: "w-52", w2: "w-60", hasSecondLine: false },
            ].map((msg, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-3 w-16 rounded bg-surface-card/60" />
                    <Skeleton className="h-3 w-12 rounded bg-surface-card/40" />
                  </div>
                  <Skeleton className={`h-3.5 rounded bg-surface-card/80 ${msg.w2}`} />
                  {msg.hasSecondLine && (
                    <Skeleton className={`h-3 rounded bg-surface-card/50 ${msg.w1}`} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Composer Input Placeholder */}
          <div className="p-3 pt-0">
            <Skeleton className="h-16 w-full rounded-xl border-border-subtle bg-surface-card/80" />
          </div>
        </main>
      </div>
    </div>
  );
};

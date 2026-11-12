"use client";

import React from "react";

export function SkeletonBlock({ className = "h-4 w-full" }: { className?: string }) {
  return <div aria-hidden="true" className={`np-skeleton ${className}`} />;
}

/** Calm structural skeleton replacing blocking spinners and "Initializing..." splash text. */
export function WorkspaceSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-950" aria-busy="true" aria-label="Loading workspace">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1200px] px-6 h-14 flex items-center justify-between">
          <SkeletonBlock className="h-5 w-28" />
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-4 w-16 hidden md:block" />
            <SkeletonBlock className="h-4 w-16 hidden md:block" />
            <SkeletonBlock className="h-8 w-24" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-6 py-12 space-y-12">
        <div className="space-y-4 max-w-2xl">
          <SkeletonBlock className="h-11 w-4/5" />
          <SkeletonBlock className="h-11 w-3/5" />
          <SkeletonBlock className="h-5 w-full mt-2" />
          <div className="flex items-center gap-3 pt-2">
            <SkeletonBlock className="h-10 w-32" />
            <SkeletonBlock className="h-5 w-28" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="rounded-[12px] border border-zinc-200 bg-white p-5 space-y-3">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-7 w-28" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          ))}
        </div>

        <div className="rounded-[12px] border border-zinc-200 bg-white p-6 space-y-4">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      </main>
    </div>
  );
}

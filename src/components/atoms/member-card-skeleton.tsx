"use client";

export function MemberCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm px-4 py-5">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
      </div>

      {/* List Items Skeleton */}
      <div className="space-y-3 pt-3 border-t border-border">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

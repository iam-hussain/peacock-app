"use client";

export function MemberCardSkeleton() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      {/* Avatar Skeleton */}
      <div className="mb-3 h-16 w-16 animate-pulse rounded-xl bg-muted" />

      {/* Name Skeleton */}
      <div className="mb-1.5 h-4 w-20 animate-pulse rounded bg-muted" />

      {/* Status Skeleton */}
      <div className="mb-2 flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-12 animate-pulse rounded bg-muted" />
      </div>

      {/* Funds Managed Skeleton */}
      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
    </div>
  );
}

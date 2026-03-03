"use client";

/**
 * Skeleton loader for match detail page.
 * Used as fallback when MatchDetailClient is lazy-loaded.
 */
export function SkeletonMatch() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="h-6 w-24 rounded bg-muted animate-pulse" />
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Score section skeleton */}
        <div className="flex items-center justify-between gap-4 py-8">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-10 w-8 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-10 w-8 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Info card skeleton */}
        <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
          <div className="h-12 px-4 flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-12 px-4 flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-12 px-4 flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Rosters skeleton */}
        <div>
          <div className="h-4 w-24 rounded bg-muted animate-pulse mb-3" />
          <div className="space-y-4">
            <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
              <div className="h-10 px-4 bg-muted/30" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 px-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
              <div className="h-10 px-4 bg-muted/30" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 px-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

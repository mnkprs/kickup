export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded-full bg-muted" />
            <div className="h-5 w-40 rounded-lg bg-muted" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="h-3 w-16 rounded-full bg-muted" />
          <div className="h-3 w-20 rounded-full bg-muted" />
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 pt-2">
        {/* Standings */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 border-b border-border last:border-b-0 bg-muted/30" />
          ))}
        </div>

        {/* Fixtures */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}

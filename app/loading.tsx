export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-muted" />
        <div className="h-10 w-10 rounded-full bg-muted" />
      </div>

      {/* Quick stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border px-2 py-3 flex flex-col items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted" />
              <div className="h-5 w-8 rounded bg-muted" />
              <div className="h-3 w-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Match cards */}
      <div className="px-5 mb-6">
        <div className="h-5 w-28 rounded bg-muted mb-3" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border p-4 h-24" />
          ))}
        </div>
      </div>

      {/* Standings */}
      <div className="px-5">
        <div className="h-5 w-24 rounded bg-muted mb-3" />
        <div className="rounded-xl bg-card border border-border h-48" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Profile header */}
      <div className="px-5 pt-12 pb-6 flex flex-col items-center gap-3">
        <div className="h-20 w-20 rounded-full bg-muted" />
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-4 w-20 rounded bg-muted" />
      </div>

      {/* Stats grid */}
      <div className="px-5 mb-6">
        <div className="h-5 w-24 rounded bg-muted mb-3" />
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border shadow-card px-2 py-3 flex flex-col items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted" />
              <div className="h-5 w-8 rounded bg-muted" />
              <div className="h-3 w-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Team card */}
      <div className="px-5 mb-6">
        <div className="h-5 w-16 rounded bg-muted mb-3" />
        <div className="rounded-xl bg-muted h-28" />
      </div>

      {/* Achievements */}
      <div className="px-5">
        <div className="h-5 w-28 rounded bg-muted mb-3" />
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border shadow-card px-2 py-3 h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header + tabs */}
      <div className="px-5 pt-12 pb-4">
        <div className="h-8 w-24 rounded-lg bg-muted mb-4" />
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-full bg-muted" />
          <div className="h-8 w-20 rounded-full bg-muted" />
        </div>
      </div>

      {/* Match cards */}
      <div className="px-5 flex flex-col gap-3 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border shadow-card p-4 h-28" />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="h-8 w-24 rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="h-10 w-10 rounded-full bg-muted" />
        </div>
      </div>

      {/* Search bar */}
      <div className="px-5 mb-4">
        <div className="h-10 rounded-xl bg-muted" />
      </div>

      {/* Team cards */}
      <div className="px-5 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-4 h-24" />
        ))}
      </div>
    </div>
  );
}

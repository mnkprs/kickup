export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="h-8 w-28 rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="h-10 w-10 rounded-full bg-muted" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-5 mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-muted" />
        ))}
      </div>

      {/* Overview stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border px-2 py-3 h-20" />
          ))}
        </div>
      </div>

      {/* Tournament cards */}
      <div className="px-5 flex flex-col gap-3">
        <div className="rounded-xl bg-muted h-36" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-4 h-32" />
        ))}
      </div>
    </div>
  );
}

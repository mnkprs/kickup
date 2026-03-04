export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Profile header - matches ProfileHeader layout */}
      <header className="profile-header px-5 pt-12 pb-2">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-20 rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="h-10 w-10 rounded-full bg-muted" />
          </div>
        </div>

        {/* Hero card */}
        <div className="rounded-xl bg-card border border-border shadow-card p-6 mb-2">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-muted ring-4 ring-accent/20" />
            <div className="text-center space-y-2">
              <div className="h-6 w-32 rounded bg-muted mx-auto" />
              <div className="flex justify-center gap-2">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-12 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Win-rate stats card */}
        <div className="rounded-xl bg-card border border-border shadow-card p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="h-3 w-16 rounded bg-muted" />
            <span className="h-4 w-8 rounded bg-muted" />
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-2.5" />
          <div className="grid grid-cols-3 divide-x divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div className="h-4 w-6 rounded bg-muted" />
                <div className="h-3 w-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main content sections */}
      <main className="flex flex-col gap-5 pb-24 px-5">
        {/* About */}
        <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
          <div className="px-4 py-3.5 flex justify-between">
            <div className="h-4 w-14 rounded bg-muted" />
            <div className="h-4 w-4 rounded bg-muted" />
          </div>
        </div>

        {/* Stats grid */}
        <div>
          <div className="h-4 w-24 rounded bg-muted mb-3" />
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-card border border-border shadow-card px-2 py-3 flex flex-col items-center gap-1.5"
              >
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="h-5 w-8 rounded bg-muted" />
                <div className="h-3 w-10 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Team card */}
        <div>
          <div className="h-4 w-16 rounded bg-muted mb-3" />
          <div className="rounded-xl bg-muted h-28" />
        </div>

        {/* Activity */}
        <div>
          <div className="h-4 w-28 rounded bg-muted mb-3" />
          <div className="rounded-xl bg-card border border-border shadow-card p-4">
            <div className="h-12 rounded bg-muted" />
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div className="h-4 w-28 rounded bg-muted mb-3" />
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-card border border-border shadow-card px-2 py-3 h-24"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

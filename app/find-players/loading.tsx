export default function Loading() {
  return (
    <div className="animate-pulse px-5 pt-12 pb-24">
      <div className="h-8 w-32 rounded-lg bg-muted mb-6" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-card border border-border p-4 h-20"
          />
        ))}
      </div>
    </div>
  );
}

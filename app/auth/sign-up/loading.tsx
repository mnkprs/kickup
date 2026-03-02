export default function Loading() {
  return (
    <div className="animate-pulse px-5 pt-12 pb-24">
      <div className="max-w-sm mx-auto space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="space-y-4">
          <div className="h-12 rounded-lg bg-muted" />
          <div className="h-12 rounded-lg bg-muted" />
          <div className="h-12 rounded-lg bg-muted" />
        </div>
        <div className="h-12 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

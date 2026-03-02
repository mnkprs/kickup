export default function Loading() {
  return (
    <div className="animate-pulse px-5 pt-12 pb-24">
      <div className="h-8 w-40 rounded-lg bg-muted mb-6" />
      <div className="space-y-4">
        <div className="h-12 rounded-lg bg-muted" />
        <div className="h-12 rounded-lg bg-muted" />
        <div className="h-12 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-12 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

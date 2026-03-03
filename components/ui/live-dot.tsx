export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative flex h-2 w-2 ${className}`}
      aria-hidden
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
    </span>
  );
}

interface StatusBadgeProps {
  label: string;
  active: boolean;
}

export function StatusBadge({ label, active }: StatusBadgeProps) {
  return (
    <span
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${
        active ? "bg-accent-foreground/15 text-accent-foreground" : "bg-muted-foreground/15 border-muted-foreground/40 text-muted-foreground"
      }`}
    >
      {active ? (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-loss opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-loss" />
        </span>
      ) : (
        <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
      )}
      {label}
    </span>
  );
}

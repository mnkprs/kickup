import type { LucideIcon } from "lucide-react";

interface StatusBadgeProps {
  label: string;
  active: boolean;
  icon: LucideIcon;
}

export function StatusBadge({ label, active, icon: Icon }: StatusBadgeProps) {
  return (
    <span
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${
        active ? "bg-accent-foreground/15 text-accent-foreground" : "bg-accent-foreground/10 text-accent-foreground/70"
      }`}
    >
      {active ? (
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-foreground opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-foreground" />
        </span>
      ) : (
        <span className="h-2 w-2 shrink-0 rounded-full bg-accent-foreground/50" aria-hidden />
      )}
      <Icon size={10} className="shrink-0" />
      {label}
    </span>
  );
}

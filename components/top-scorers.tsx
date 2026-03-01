import type { TopScorer } from "@/lib/types";
import { Crown } from "lucide-react";
import Link from "next/link";

interface TopScorersProps {
  scorers: TopScorer[];
}

export function TopScorers({ scorers }: TopScorersProps) {
  if (scorers.length === 0) return null;

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-base">Top Scorers</h2>
        <Link href="/tournaments" className="text-accent text-xs font-medium hover:underline">
          See all
        </Link>
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        {scorers.map((entry, i) => {
          const isTop = i === 0;
          return (
            <div
              key={entry.player.id}
              className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0"
            >
              <span className={`w-5 text-xs font-bold shrink-0 ${isTop ? "text-draw" : "text-muted-foreground"}`}>
                {i + 1}
              </span>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border relative">
                <span className="text-foreground text-[10px] font-bold">
                  {entry.player.avatar_initials || entry.player.full_name.split(" ").map((n) => n[0]).join("")}
                </span>
                {isTop && (
                  <Crown size={10} className="absolute -top-1.5 -right-1 text-draw" fill="currentColor" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-foreground text-sm font-medium block truncate">
                  {entry.player.full_name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {entry.team_short_name} · {entry.player.position}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-foreground font-bold text-sm">{entry.goals}</span>
                <span className="text-muted-foreground text-[10px]">goals</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

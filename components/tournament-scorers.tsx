import type { TopScorer } from "@/lib/types";
import { Crown } from "lucide-react";

interface TournamentScorersProps {
  scorers: TopScorer[];
  title?: string;
}

export function TournamentScorers({ scorers, title = "Top Scorers" }: TournamentScorersProps) {
  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-base">{title}</h2>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card p-4">
        {scorers.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No scorers yet</p>
        ) : (
        scorers.map((entry, i) => {
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
                <span className="text-foreground text-sm font-medium block truncate">{entry.player.full_name}</span>
                <span className="text-muted-foreground text-xs">
                  {entry.team_short_name} · {entry.player.position ?? "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <span className="text-foreground font-bold text-sm block">{entry.goals}</span>
                  <span className="text-muted-foreground text-[9px]">goals</span>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>
    </section>
  );
}

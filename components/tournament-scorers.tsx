import type { TopScorer } from "@/lib/types";
import { Crown } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";

interface TournamentScorersProps {
  scorers: TopScorer[];
  title?: string;
}

export function TournamentScorers({ scorers, title = "Top Scorers" }: TournamentScorersProps) {
  return (
    <section className="tournament-scorers px-5">
      <div className="tournament-scorers__header flex items-center justify-between mb-3">
        <h2 className="tournament-scorers__title text-foreground font-semibold text-base">{title}</h2>
      </div>
      <div className="tournament-scorers__list rounded-xl bg-card border border-border shadow-card p-4">
        {scorers.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No scorers yet</p>
        ) : (
        scorers.map((entry, i) => {
          const isTop = i === 0;
          return (
            <Link
              key={entry.player.id}
              href={`/profile/${entry.player.id}`}
              className="tournament-scorers__row flex items-center gap-3 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors -mx-2 px-2 rounded-lg cursor-pointer"
            >
              <span className={`w-5 text-xs font-bold shrink-0 ${isTop ? "text-draw" : "text-muted-foreground"}`}>
                {i + 1}
              </span>
              <div className="relative shrink-0">
                <Avatar
                  avatar_url={entry.player.avatar_url}
                  avatar_initials={entry.player.avatar_initials}
                  avatar_color={entry.player.avatar_color}
                  full_name={entry.player.full_name}
                  size="2xs"
                  className="border border-border"
                />
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
            </Link>
          );
        })
        )}
      </div>
    </section>
  );
}

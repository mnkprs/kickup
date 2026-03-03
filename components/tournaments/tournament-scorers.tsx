import type { TopScorer } from "@/lib/types";
import { Crown } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { isUnknownPlayer } from "@/lib/constants";

interface TournamentScorersProps {
  scorers: TopScorer[];
  title?: string;
}

const RANK_STYLES = [
  { color: "text-draw", bg: "bg-draw/10", crown: true },
  { color: "text-[#94a3b8]", bg: "bg-[#94a3b8]/10", crown: false },
  { color: "text-[#b45309]", bg: "bg-[#b45309]/10", crown: false },
] as const;

function getRankStyle(index: number) {
  return RANK_STYLES[index] ?? { color: "text-muted-foreground", bg: "", crown: false };
}

export function TournamentScorers({ scorers, title = "Top Scorers" }: TournamentScorersProps) {
  return (
    <section className="tournament-scorers">
      <div className="tournament-scorers__header flex items-center justify-between mb-3">
        <h2 className="tournament-scorers__title text-foreground font-semibold text-base">{title}</h2>
      </div>
      <div className="tournament-scorers__list rounded-lg bg-card border border-border shadow-card overflow-hidden">
        {scorers.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No scorers yet</p>
        ) : (
          <ul className="divide-y divide-border">
            {scorers.map((entry, i) => {
              const rankStyle = getRankStyle(i);
              const isPodium = i < 3;
              const isUnknown = isUnknownPlayer(entry.player.id);
              const rowContent = (
                <>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${rankStyle.color} ${rankStyle.bg}`}
                    >
                      {i + 1}
                    </span>
                    <div className="relative shrink-0">
                      <Avatar
                        avatar_url={entry.player.avatar_url}
                        avatar_initials={entry.player.avatar_initials}
                        avatar_color={entry.player.avatar_color}
                        full_name={entry.player.full_name}
                        size={i === 0 ? "sm" : "2xs"}
                        className="border-2 border-border"
                      />
                      {rankStyle.crown && (
                        <Crown
                          size={12}
                          className="absolute -top-1 -right-1 text-draw drop-shadow-sm"
                          fill="currentColor"
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground text-sm font-semibold block truncate">
                        {entry.player.full_name}
                      </span>
                      <span className="text-muted-foreground text-xs truncate block">
                        {entry.team_short_name} · {entry.player.position ?? "—"}
                      </span>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md bg-accent/12 px-2.5 font-bold text-accent text-sm tabular-nums">
                        {entry.goals}
                      </span>
                      <span className="sr-only">goals</span>
                    </div>
                </>
              );
              return (
                <li key={entry.player.id}>
                  {isUnknown ? (
                    <div className="tournament-scorers__row flex items-center gap-4 px-4 py-3">
                      {rowContent}
                    </div>
                  ) : (
                    <Link
                      href={`/profile/${entry.player.id}`}
                      className="tournament-scorers__row flex items-center gap-4 px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors"
                    >
                      {rowContent}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

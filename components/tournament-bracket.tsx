"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MapPin, Clock, Trophy } from "lucide-react";
import type { TournamentMatchWithStage } from "@/lib/db/tournaments";
import { TeamAvatar } from "@/components/team-avatar";

const STAGE_LABELS: Record<string, string> = {
  round_of_16: "Round of 16",
  quarter_final: "Quarter-finals",
  semi_final: "Semi-finals",
  final: "Final",
};

interface TournamentBracketProps {
  matches: TournamentMatchWithStage[];
}

function BracketMatch({ match, label }: { match: TournamentMatchWithStage; label?: string }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="block rounded-xl bg-card border border-border shadow-card p-4 hover:border-accent/40 transition-colors pressable"
    >
      {label && (
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {label}
        </div>
      )}
      <div className="flex items-center gap-2 mb-1">
        <Clock size={10} className="text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground">
          {match.date ? format(parseISO(match.date), "d MMM") : "TBC"}
          {match.time ? ` · ${match.time.slice(0, 5)}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TeamAvatar
          team={match.home_team}
          size="sm"
        />
        <span className="text-sm font-medium truncate flex-1 min-w-0">
          {match.home_team.short_name}
        </span>
        <span className="text-sm font-bold shrink-0 px-2">
          {match.home_score !== null && match.away_score !== null
            ? `${match.home_score}–${match.away_score}`
            : "vs"}
        </span>
        <span className="text-sm font-medium truncate flex-1 min-w-0 text-right">
          {match.away_team.short_name}
        </span>
        <TeamAvatar
          team={match.away_team}
          size="sm"
        />
      </div>
      {match.location && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
          <MapPin size={10} className="text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-xs truncate">{match.location}</span>
        </div>
      )}
    </Link>
  );
}

export function TournamentBracket({ matches }: TournamentBracketProps) {
  const knockoutMatches = matches.filter(
    (m) =>
      m.stage === "round_of_16" ||
      m.stage === "quarter_final" ||
      m.stage === "semi_final" ||
      m.stage === "final"
  );

  if (knockoutMatches.length === 0) return null;

  const byRound = new Map<number, TournamentMatchWithStage[]>();
  for (const m of knockoutMatches) {
    const order = m.round_order ?? 0;
    if (!byRound.has(order)) byRound.set(order, []);
    byRound.get(order)!.push(m);
  }
  const rounds = [...byRound.entries()].sort(([a], [b]) => a - b);

  return (
    <section className="tournament-bracket px-5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-draw shrink-0" />
        <h2 className="text-foreground font-semibold text-base">Knockout Bracket</h2>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card p-4">
        <div className="flex flex-col gap-4">
          {rounds.map(([order, roundMatches]) => {
            const stage = roundMatches[0]?.stage;
            const label = stage ? STAGE_LABELS[stage] ?? `Round ${order}` : `Round ${order}`;
            return (
              <div key={order}>
                <div className="text-xs font-semibold text-muted-foreground mb-2">{label}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roundMatches
                    .sort((a, b) => (a.match_order ?? 0) - (b.match_order ?? 0))
                    .map((m, i) => (
                      <BracketMatch
                        key={m.id}
                        match={m}
                        label={roundMatches.length > 1 ? `Match ${i + 1}` : undefined}
                      />
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

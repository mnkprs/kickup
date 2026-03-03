"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MapPin, Clock, Trophy } from "lucide-react";
import type { TournamentMatchWithStage } from "@/lib/db/tournaments";
import { TeamAvatar } from "@/components/team-avatar";

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
    (m) => m.stage === "semi_final" || m.stage === "final"
  );

  if (knockoutMatches.length === 0) return null;

  const semiFinals = knockoutMatches.filter((m) => m.stage === "semi_final");
  const finalMatch = knockoutMatches.find((m) => m.stage === "final");

  return (
    <section className="tournament-bracket px-5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-draw shrink-0" />
        <h2 className="text-foreground font-semibold text-base">Knockout Bracket</h2>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card p-4">
        <div className="flex flex-col gap-4">
          {semiFinals.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Semi-finals</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {semiFinals.map((m, i) => (
                  <BracketMatch key={m.id} match={m} label={`Semi-final ${i + 1}`} />
                ))}
              </div>
            </div>
          )}
          {finalMatch && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Final</div>
              <BracketMatch match={finalMatch} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

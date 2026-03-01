"use client";

import { matches } from "@/lib/mock-data";
import type { Match } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";

function getResultForTeam(match: Match, teamId: string) {
  if (match.home_score === null || match.away_score === null) return null;
  const isHome = match.home_team.id === teamId;
  const teamScore = isHome ? match.home_score : match.away_score;
  const opponentScore = isHome ? match.away_score : match.home_score;
  if (teamScore > opponentScore) return "W";
  if (teamScore < opponentScore) return "L";
  return "D";
}

const resultStyles: Record<string, { bg: string; text: string }> = {
  W: { bg: "bg-win/15", text: "text-win" },
  L: { bg: "bg-loss/15", text: "text-loss" },
  D: { bg: "bg-draw/15", text: "text-draw" },
};

function ResultMatchCard({ match }: { match: Match }) {
  const myTeamId = "team_001";
  const result = getResultForTeam(match, myTeamId);
  const style = result ? resultStyles[result] : null;

  return (
    <div className="rounded-xl bg-card border border-border p-4 hover:border-accent/40 transition-colors cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-xs">
          {format(parseISO(match.date), "EEE, d MMM yyyy")}
        </span>
        {style && result && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
          >
            {result === "W" ? "Win" : result === "L" ? "Loss" : "Draw"}
          </span>
        )}
      </div>

      {/* Scoreline */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="text-foreground text-sm font-medium truncate text-right">
            {match.home_team.short_name}
          </span>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
            <span className="text-foreground font-bold text-[10px]">
              {match.home_team.short_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-foreground font-bold text-xl">
            {match.home_score}
          </span>
          <span className="text-muted-foreground text-xs">-</span>
          <span className="text-foreground font-bold text-xl">
            {match.away_score}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
            <span className="text-foreground font-bold text-[10px]">
              {match.away_team.short_name}
            </span>
          </div>
          <span className="text-foreground text-sm font-medium truncate">
            {match.away_team.short_name}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border">
        <span className="text-muted-foreground text-xs truncate">
          {match.location}
        </span>
      </div>
    </div>
  );
}

export function MatchesResults() {
  const completedMatches = matches.filter((m) => m.status === "completed");

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-base">
          {completedMatches.length} Results
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {completedMatches.map((match) => (
          <ResultMatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

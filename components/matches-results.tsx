import type { Match } from "@/lib/types";
import { format, parseISO } from "date-fns";
import Link from "next/link";

function getResultForTeam(match: Match, teamId: string | null | undefined) {
  if (!teamId || match.home_score === null || match.away_score === null) return null;
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

interface MatchesResultsProps {
  matches: Match[];
  teamId?: string | null;
}

function ResultMatchCard({ match, teamId }: { match: Match; teamId?: string | null }) {
  const result = getResultForTeam(match, teamId);
  const style = result ? resultStyles[result] : null;

  return (
    <Link href={`/matches/${match.id}`} className="rounded-xl bg-card border border-border shadow-card p-4 hover:border-accent/40 transition-colors cursor-pointer group block">
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-xs">
          {match.date ? format(parseISO(match.date), "EEE, d MMM yyyy") : ""}
        </span>
        {style && result && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
          >
            {result === "W" ? "Win" : result === "L" ? "Loss" : "Draw"}
          </span>
        )}
      </div>

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

      {match.location && (
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border">
          <span className="text-muted-foreground text-xs truncate">
            {match.location}
          </span>
        </div>
      )}
    </Link>
  );
}

export function MatchesResults({ matches, teamId }: MatchesResultsProps) {
  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-base">
          {matches.length} Results
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {matches.map((match) => (
          <ResultMatchCard key={match.id} match={match} teamId={teamId} />
        ))}
      </div>
    </section>
  );
}

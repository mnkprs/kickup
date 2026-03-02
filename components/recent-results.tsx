import type { Match } from "@/lib/types";
import { format, parseISO } from "date-fns";
import Link from "next/link";

function getResultForTeam(match: Match, teamId: string | null | undefined) {
  if (!teamId || match.home_score === null || match.away_score === null) return null;
  const isHome = match.home_team_id === teamId;
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

function CompletedMatchRow({ match, teamId }: { match: Match; teamId: string | null | undefined }) {
  const result = getResultForTeam(match, teamId);
  const style = result ? resultStyles[result] : null;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 -mx-1 px-1 rounded-lg transition-colors">
      {style && result && (
        <div className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
          <span className={`text-xs font-bold ${style.text}`}>{result}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground text-sm font-medium truncate">
            {match.home_team.short_name}
          </span>
          <span className="text-foreground font-bold text-sm">{match.home_score}</span>
          <span className="text-muted-foreground text-xs">-</span>
          <span className="text-foreground font-bold text-sm">{match.away_score}</span>
          <span className="text-foreground text-sm font-medium truncate">
            {match.away_team.short_name}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">
          {match.date ? format(parseISO(match.date), "d MMM yyyy") : ""}
        </span>
      </div>
    </div>
  );
}

interface RecentResultsProps {
  matches: Match[];
  teamId?: string | null;
}

export function RecentResults({ matches, teamId }: RecentResultsProps) {
  const completedMatches = matches
    .filter((m) => m.status === "completed")
    .slice(0, 4);

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-base">Recent Results</h2>
        <Link
          href="/matches?tab=Results"
          className="text-accent text-xs font-medium hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card p-4">
        {completedMatches.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No recent results</p>
        ) : (
          completedMatches.map((match) => (
            <Link key={match.id} href={`/matches/${match.id}`} className="block">
              <CompletedMatchRow match={match} teamId={teamId} />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

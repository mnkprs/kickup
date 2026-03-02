import type { Match } from "@/lib/types";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Trophy, MapPin } from "lucide-react";
import { TeamAvatar } from "@/components/team-avatar";

function getResultForTeam(match: Match, teamId: string | null | undefined) {
  if (!teamId || match.home_score === null || match.away_score === null) return null;
  const isOurMatch = match.home_team_id === teamId || match.away_team_id === teamId;
  if (!isOurMatch) return null;
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

interface MatchesResultsProps {
  matches: Match[];
  teamId?: string | null;
}

function ResultMatchCard({ match, teamId }: { match: Match; teamId?: string | null }) {
  const result = getResultForTeam(match, teamId);
  const style = result ? resultStyles[result] : null;

  return (
    <div className="rounded-xl bg-card border border-border shadow-card p-4 hover:border-accent/40 transition-colors group block pressable">
      <Link href={`/matches/${match.id}`} className="block -m-4 p-4">
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
            <TeamAvatar team={match.home_team} size="2xs" />
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
            <TeamAvatar team={match.away_team} size="2xs" />
            <span className="text-foreground text-sm font-medium truncate">
              {match.away_team.short_name}
            </span>
          </div>
        </div>
      </Link>

      {(match.location || match.tournament) && (
        <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-border">
          {match.tournament && (
            <Link
              href={`/tournaments/${match.tournament.id}`}
              className="flex items-center gap-1.5 text-draw hover:text-draw/80 transition-colors w-fit"
            >
              <Trophy size={12} className="shrink-0" />
              <span className="text-xs font-medium truncate">{match.tournament.name}</span>
            </Link>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-muted-foreground text-xs">
            {match.date && (
              <span>{format(parseISO(match.date), "d MMM yyyy")}</span>
            )}
            {match.time && (
              <span>{match.time.slice(0, 5)}</span>
            )}
            {match.location && (
              <span className="flex items-center gap-1">
                <MapPin size={10} className="shrink-0" />
                {match.location}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
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

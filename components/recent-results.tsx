import type { Match } from "@/lib/types";
import { format, parseISO } from "date-fns";
import Link from "next/link";
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

interface CompletedMatchRowProps {
  match: Match;
  teamId?: string | null;
}

function CompletedMatchRow({ match, teamId }: CompletedMatchRowProps) {
  const result = getResultForTeam(match, teamId);
  const style = result ? resultStyles[result] : null;

  return (
    <div className="recent-results__row flex items-center gap-3 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 -mx-1 px-1 rounded-lg transition-colors pressable">
      {style && result ? (
        <div className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
          <span className={`text-xs font-bold ${style.text}`}>{result}</span>
        </div>
      ) : (
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-muted-foreground">FT</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <TeamAvatar team={match.home_team} size="xs" />
            <span className="text-foreground text-sm font-medium truncate" title={match.home_team.name}>
              {match.home_team.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-foreground font-bold text-sm tabular-nums">{match.home_score}</span>
            <span className="text-muted-foreground text-xs">–</span>
            <span className="text-foreground font-bold text-sm tabular-nums">{match.away_score}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
            <span className="text-foreground text-sm font-medium truncate text-right" title={match.away_team.name}>
              {match.away_team.name}
            </span>
            <TeamAvatar team={match.away_team} size="xs" />
          </div>
        </div>
        <span className="text-muted-foreground text-xs mt-0.5 block">
          {match.date ? format(parseISO(match.date), "d MMM yyyy") : ""}
        </span>
      </div>
    </div>
  );
}

export interface RecentResultsProps {
  matches: Match[];
  teamId?: string | null;
  /** Section title. Default: "Recent Results" */
  title?: string;
  /** Link for "See all". Omit for embedded/tournament context. */
  seeAllHref?: string;
  /** Max items to show. Default: 4 for section, unlimited for embedded. */
  maxItems?: number;
  /** "section" = standalone card with padding (home). "embedded" = compact inside parent (tournament). */
  variant?: "section" | "embedded";
}

export function RecentResults({
  matches,
  teamId,
  title = "Recent Results",
  seeAllHref,
  maxItems = 4,
  variant = "section",
}: RecentResultsProps) {
  const completedMatches = matches
    .filter((m) => m.status === "completed")
    .slice(0, maxItems);

  const listContent =
    completedMatches.length === 0 ? (
      <p className="text-muted-foreground text-sm text-center py-6">No recent results</p>
    ) : (
      completedMatches.map((match) => (
        <Link key={match.id} href={`/matches/${match.id}`} className="block">
          <CompletedMatchRow match={match} teamId={teamId} />
        </Link>
      ))
    );

  if (variant === "embedded") {
    return (
      <div className="recent-results recent-results--embedded">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
        {completedMatches.length > 0 ? (
          <div className="rounded-lg border border-border overflow-hidden max-h-[320px] overflow-y-auto">
            {listContent}
          </div>
        ) : (
          listContent
        )}
      </div>
    );
  }

  return (
    <section className="recent-results px-5">
      <div className="recent-results__header flex items-center justify-between mb-3">
        <h2 className="recent-results__title text-foreground font-semibold text-base">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="recent-results__see-all text-accent text-xs font-medium hover:underline"
          >
            See all
          </Link>
        )}
      </div>
      <div className="recent-results__list rounded-xl bg-card border border-border shadow-card p-4">
        {listContent}
      </div>
    </section>
  );
}

import type { Match } from "@/lib/types";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { TeamAvatar } from "@/components/team-avatar";

interface CompletedMatchRowProps {
  match: Match;
}

function CompletedMatchRow({ match }: CompletedMatchRowProps) {
  return (
    <div className="recent-results__row recent-results__row--interactive flex items-center gap-3 py-3 border-b border-border last:border-b-0 -mx-5 px-5 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors pressable">
      <div className="recent-results__row-inner flex-1 min-w-0">
        <div className="recent-results__teams flex items-center gap-2 min-w-0">
          <div className="recent-results__team recent-results__team--home flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <TeamAvatar team={match.home_team} size="xs" className="recent-results__team-avatar" />
            <span className="recent-results__team-name text-foreground text-sm font-medium truncate" title={match.home_team.name}>
              {match.home_team.name}
            </span>
          </div>
          <div className="recent-results__score-block flex flex-col items-center shrink-0">
            <div className="recent-results__score flex items-center gap-1">
              <span className="text-foreground font-bold text-sm tabular-nums">{match.home_score}</span>
              <span className="text-muted-foreground text-xs">–</span>
              <span className="text-foreground font-bold text-sm tabular-nums">{match.away_score}</span>
            </div>
            <span className="recent-results__date text-muted-foreground text-xs mt-0.5">
              {match.date ? format(parseISO(match.date), "d MMM yyyy") : ""}
            </span>
          </div>
          <div className="recent-results__team recent-results__team--away flex items-center gap-1.5 min-w-0 flex-1 justify-end overflow-hidden">
            <span className="recent-results__team-name text-foreground text-sm font-medium truncate text-right" title={match.away_team.name}>
              {match.away_team.name}
            </span>
            <TeamAvatar team={match.away_team} size="xs" className="recent-results__team-avatar" />
          </div>
        </div>
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
          <CompletedMatchRow match={match} />
        </Link>
      ))
    );

  if (variant === "embedded") {
    return (
      <div className="recent-results recent-results--embedded">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
        {completedMatches.length > 0 ? (
          <div className="rounded-lg overflow-hidden max-h-[320px] overflow-y-auto">
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

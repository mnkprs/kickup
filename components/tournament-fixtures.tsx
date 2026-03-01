"use client";

import { tournamentMatches } from "@/lib/mock-data";
import type { TournamentMatch } from "@/lib/mock-data";
import { MapPin, ChevronRight, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

function TeamBadge({ shortName }: { shortName: string }) {
  return (
    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
      <span className="text-foreground font-bold text-xs">{shortName}</span>
    </div>
  );
}

function UpcomingFixture({ match }: { match: TournamentMatch }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4 hover:border-accent/40 transition-colors cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-accent" />
            <span className="text-xs font-medium text-accent">
              {format(parseISO(match.date), "d MMM")} · {match.time.slice(0, 5)}
            </span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {match.round}
          </span>
        </div>
        <ChevronRight
          size={16}
          className="text-muted-foreground group-hover:text-foreground transition-colors"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <TeamBadge shortName={match.home_team.short_name} />
          <span className="text-foreground text-sm font-medium truncate">
            {match.home_team.name}
          </span>
        </div>
        <span className="text-muted-foreground text-xs font-bold px-3 shrink-0">
          VS
        </span>
        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
          <span className="text-foreground text-sm font-medium truncate text-right">
            {match.away_team.name}
          </span>
          <TeamBadge shortName={match.away_team.short_name} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
        <MapPin size={12} className="text-muted-foreground shrink-0" />
        <span className="text-muted-foreground text-xs truncate">
          {match.location}
        </span>
      </div>
    </div>
  );
}

function CompletedFixture({ match }: { match: TournamentMatch }) {
  const myTeamId = "team_001";
  const isHome = match.home_team.id === myTeamId;
  const isAway = match.away_team.id === myTeamId;
  let result: string | null = null;

  if ((isHome || isAway) && match.home_score !== null && match.away_score !== null) {
    const myScore = isHome ? match.home_score : match.away_score;
    const oppScore = isHome ? match.away_score : match.home_score;
    if (myScore > oppScore) result = "W";
    else if (myScore < oppScore) result = "L";
    else result = "D";
  }

  const resultStyles: Record<string, { bg: string; text: string }> = {
    W: { bg: "bg-win/15", text: "text-win" },
    L: { bg: "bg-loss/15", text: "text-loss" },
    D: { bg: "bg-draw/15", text: "text-draw" },
  };

  const style = result ? resultStyles[result] : null;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 -mx-1 px-1 rounded-lg transition-colors">
      {style && result ? (
        <div
          className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}
        >
          <span className={`text-xs font-bold ${style.text}`}>{result}</span>
        </div>
      ) : (
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-muted-foreground">-</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground text-sm font-medium truncate">
            {match.home_team.short_name}
          </span>
          <span className="text-foreground font-bold text-sm">
            {match.home_score}
          </span>
          <span className="text-muted-foreground text-xs">-</span>
          <span className="text-foreground font-bold text-sm">
            {match.away_score}
          </span>
          <span className="text-foreground text-sm font-medium truncate">
            {match.away_team.short_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {format(parseISO(match.date), "d MMM yyyy")}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {match.round}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TournamentFixtures() {
  const upcoming = tournamentMatches.filter((m) => m.status === "upcoming");
  const completed = tournamentMatches.filter((m) => m.status === "completed");

  return (
    <>
      {/* Upcoming Fixtures */}
      {upcoming.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-foreground font-semibold text-base">
              Next Fixtures
            </h2>
            <span className="text-muted-foreground text-xs">Sunday League Spring</span>
          </div>
          <div className="flex flex-col gap-3">
            {upcoming.map((match) => (
              <UpcomingFixture key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Fixtures */}
      {completed.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-foreground font-semibold text-base">
              Recent Results
            </h2>
            <button className="text-accent text-xs font-medium hover:underline">
              See all
            </button>
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            {completed.map((match) => (
              <CompletedFixture key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

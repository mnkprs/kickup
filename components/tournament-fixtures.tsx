import type { Match } from "@/lib/types";
import Link from "next/link";
import { MapPin, ChevronRight, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

function TeamBadge({ shortName }: { shortName: string }) {
  return (
    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
      <span className="text-foreground font-bold text-xs">{shortName}</span>
    </div>
  );
}

function UpcomingFixture({ match }: { match: Match }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="rounded-xl bg-card border border-border p-4 hover:border-accent/40 transition-colors cursor-pointer group block"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-accent" />
          <span className="text-xs font-medium text-accent">
            {match.date ? format(parseISO(match.date), "d MMM") : "TBC"}
            {match.time ? ` · ${match.time.slice(0, 5)}` : ""}
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
          <span className="text-foreground text-sm font-medium truncate">{match.home_team.name}</span>
        </div>
        <span className="text-muted-foreground text-xs font-bold px-3 shrink-0">VS</span>
        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
          <span className="text-foreground text-sm font-medium truncate text-right">{match.away_team.name}</span>
          <TeamBadge shortName={match.away_team.short_name} />
        </div>
      </div>
      {match.location && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
          <MapPin size={12} className="text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-xs truncate">{match.location}</span>
        </div>
      )}
    </Link>
  );
}

function CompletedFixture({ match }: { match: Match }) {
  const resultStyles: Record<string, { bg: string; text: string }> = {
    W: { bg: "bg-win/15", text: "text-win" },
    L: { bg: "bg-loss/15", text: "text-loss" },
    D: { bg: "bg-draw/15", text: "text-draw" },
  };

  return (
    <Link
      href={`/matches/${match.id}`}
      className="flex items-center gap-3 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 -mx-1 px-1 rounded-lg transition-colors block"
    >
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-muted-foreground">-</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-foreground text-sm font-medium">{match.home_team.short_name}</span>
          <span className="text-foreground font-bold text-sm">{match.home_score}</span>
          <span className="text-muted-foreground text-xs">-</span>
          <span className="text-foreground font-bold text-sm">{match.away_score}</span>
          <span className="text-foreground text-sm font-medium">{match.away_team.short_name}</span>
        </div>
        <span className="text-muted-foreground text-xs">
          {match.date ? format(parseISO(match.date), "d MMM yyyy") : ""}
        </span>
      </div>
    </Link>
  );
}

interface TournamentFixturesProps {
  matches: Match[];
}

export function TournamentFixtures({ matches }: TournamentFixturesProps) {
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const completed = matches.filter((m) => m.status === "completed");

  return (
    <>
      {upcoming.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-foreground font-semibold text-base">Next Fixtures</h2>
          </div>
          <div className="flex flex-col gap-3">
            {upcoming.map((match) => (
              <UpcomingFixture key={match.id} match={match} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-foreground font-semibold text-base">Recent Results</h2>
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

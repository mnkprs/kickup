"use client";

import { matches } from "@/lib/mock-data";
import type { Match } from "@/lib/mock-data";
import { MapPin, ChevronRight, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

function formatMatchDate(dateStr: string, timeStr: string) {
  const date = parseISO(dateStr);
  return `${format(date, "d MMM")} · ${timeStr.slice(0, 5)}`;
}

function TeamBadge({ shortName }: { shortName: string }) {
  return (
    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
      <span className="text-foreground font-bold text-xs">{shortName}</span>
    </div>
  );
}

function UpcomingMatchCard({ match }: { match: Match }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4 hover:border-accent/40 transition-colors cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-accent" />
          <span className="text-xs font-medium text-accent">
            {formatMatchDate(match.date, match.time)}
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

export function UpcomingMatches() {
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-base">
          Upcoming Matches
        </h2>
        <Link
          href="/matches"
          className="text-accent text-xs font-medium hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {upcomingMatches.map((match) => (
          <UpcomingMatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

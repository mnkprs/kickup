"use client";

import type { Match } from "@/lib/types";
import { MapPin, Clock, ChevronRight, Trophy } from "lucide-react";
import { LiveDot } from "@/components/live-dot";
import { TeamAvatar } from "@/components/team-avatar";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatMatchDate(dateStr: string | null, timeStr: string | null) {
  if (!dateStr) return "TBC";
  const formatted = format(parseISO(dateStr), "EEE, d MMM");
  return timeStr ? `${formatted} · ${timeStr.slice(0, 5)}` : formatted;
}

function UpcomingMatchCard({ match }: { match: Match }) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/matches/${match.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/matches/${match.id}`)}
      className="match-card match-card--upcoming rounded-xl bg-card border border-border shadow-card p-4 hover:border-accent/40 transition-colors cursor-pointer group block pressable"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {match.status === "live" && <LiveDot className="shrink-0" />}
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
          <TeamAvatar team={match.home_team} size="lg" />
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
          <TeamAvatar team={match.away_team} size="lg" />
        </div>
      </div>
      {(match.location || match.tournament) && (
        <div className="flex flex-col items-center gap-1.5 mt-3 pt-3 border-t border-border">
          {match.tournament && (
            <Link
              href={`/tournaments/${match.tournament.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 text-draw hover:text-draw/80 transition-colors"
            >
              <Trophy size={12} className="shrink-0" />
              <span className="text-xs font-medium truncate">{match.tournament.name}</span>
            </Link>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-muted-foreground text-xs">
            {match.date && (
              <span>{format(parseISO(match.date), "d MMM")}</span>
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

export function MatchesUpcoming({ matches }: { matches: Match[] }) {
  return (
    <section className="matches-upcoming px-5">
      <div className="matches-upcoming__header flex items-center justify-between mb-3">
        <h2 className="matches-upcoming__title text-foreground font-semibold text-base">
          {matches.length} Upcoming
        </h2>
      </div>
      <div className="matches-upcoming__list flex flex-col gap-3">
        {matches.map((match) => (
          <UpcomingMatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

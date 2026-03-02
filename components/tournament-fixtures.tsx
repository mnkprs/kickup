"use client";

import { useState } from "react";
import type { Match } from "@/lib/types";
import Link from "next/link";
import { MapPin, ChevronRight, Clock, CalendarPlus } from "lucide-react";
import { LiveDot } from "@/components/live-dot";
import { format, parseISO } from "date-fns";
import { ScheduleTournamentMatchForm } from "@/components/schedule-tournament-match-form";

function TeamBadge({ shortName }: { shortName: string }) {
  return (
    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
      <span className="text-foreground font-bold text-xs">{shortName}</span>
    </div>
  );
}

interface UpcomingFixtureProps {
  match: Match;
  tournamentId?: string;
  canManageSchedule?: boolean;
}

function UpcomingFixture({ match, tournamentId, canManageSchedule }: UpcomingFixtureProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  return (
    <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
      <Link
        href={`/matches/${match.id}`}
        className="block p-4 hover:border-accent/40 transition-colors group"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {match.status === "live" && <LiveDot className="shrink-0" />}
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
      {canManageSchedule && tournamentId && (
        <>
          {showScheduleForm ? (
            <div className="px-4 pb-4 pt-0 border-t border-border">
              <ScheduleTournamentMatchForm
                matchId={match.id}
                tournamentId={tournamentId}
                currentDate={match.date}
                currentTime={match.time}
                onClose={() => setShowScheduleForm(false)}
              />
            </div>
          ) : (
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowScheduleForm(true);
                }}
                className="flex items-center gap-2 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <CalendarPlus size={14} />
                Set date & time
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CompletedFixture({ match }: { match: Match }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      className="flex items-center gap-3 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 -mx-1 px-1 rounded-lg transition-colors block"
    >
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-muted-foreground">FT</span>
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
  tournamentId?: string;
  canManageSchedule?: boolean;
}

export function TournamentFixtures({
  matches,
  tournamentId,
  canManageSchedule,
}: TournamentFixturesProps) {
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const completed = matches.filter((m) => m.status === "completed");

  return (
    <>
      {live.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-foreground font-semibold text-base">Live Now</h2>
          </div>
          <div className="flex flex-col gap-3">
            {live.map((match) => (
              <UpcomingFixture
                key={match.id}
                match={match}
                tournamentId={tournamentId}
                canManageSchedule={canManageSchedule}
              />
            ))}
          </div>
        </section>
      )}
      <section className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-foreground font-semibold text-base">Next Fixtures</h2>
        </div>
        {upcoming.length > 0 ? (
          <div className="flex flex-col gap-3">
            {upcoming.map((match) => (
              <UpcomingFixture
                key={match.id}
                match={match}
                tournamentId={tournamentId}
                canManageSchedule={canManageSchedule}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border shadow-card px-4 py-8 text-center">
            <p className="text-muted-foreground text-sm">No fixtures scheduled yet</p>
          </div>
        )}
      </section>

      <section className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-foreground font-semibold text-base">Recent Results</h2>
        </div>
        {completed.length > 0 ? (
          <div className="rounded-xl bg-card border border-border shadow-card p-4">
            {completed.map((match) => (
              <CompletedFixture key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border shadow-card px-4 py-8 text-center">
            <p className="text-muted-foreground text-sm">No results yet</p>
          </div>
        )}
      </section>
    </>
  );
}

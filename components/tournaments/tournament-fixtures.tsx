"use client";

import { useState } from "react";
import type { Match } from "@/lib/types";
import type { TournamentMatchWithStage } from "@/lib/db/tournaments";
import Link from "next/link";
import { MapPin, ChevronRight, Clock, CalendarPlus, UserPlus } from "lucide-react";
import { LiveDot } from "@/components/ui/live-dot";
import { format, parseISO } from "date-fns";
import { ScheduleTournamentMatchForm } from "@/components/matches/schedule-tournament-match-form";
import { AssignTeamsToMatchForm } from "@/components/matches/assign-teams-to-match-form";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { RecentResults } from "@/components/ui/recent-results";
import { isTbdMatch, KNOCKOUT_STAGE_LABELS } from "@/lib/constants";

const KNOCKOUT_STAGES = ["round_of_16", "quarter_final", "semi_final", "final"] as const;

interface UpcomingFixtureProps {
  match: Match & { stage?: string };
  tournamentId?: string;
  canManageSchedule?: boolean;
  canManageKnockout?: boolean;
  knockoutMatches?: TournamentMatchWithStage[];
  advancingTeams?: { id: string; name: string; short_name: string }[];
  onAssignSuccess?: () => void;
}

function UpcomingFixture({
  match,
  tournamentId,
  canManageSchedule,
  canManageKnockout,
  knockoutMatches = [],
  advancingTeams = [],
  onAssignSuccess,
}: UpcomingFixtureProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const isKnockoutMatch =
    match.stage && KNOCKOUT_STAGES.includes(match.stage as (typeof KNOCKOUT_STAGES)[number]);
  const showAssignTeams =
    isKnockoutMatch && canManageKnockout && tournamentId && advancingTeams.length >= 2;

  return (
    <div className="tournament-fixture tournament-fixture--upcoming rounded-xl bg-card border border-border shadow-card overflow-hidden">
      <Link
        href={`/matches/${match.id}`}
        className="block p-4 hover:border-accent/40 transition-colors group pressable"
      >
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {match.status === "live" && <LiveDot className="shrink-0" />}
            <Clock size={12} className="text-accent shrink-0" />
            <span className="text-xs font-medium text-accent">
              {match.date ? format(parseISO(match.date), "d MMM") : "TBC"}
              {match.time ? ` · ${match.time.slice(0, 5)}` : ""}
            </span>
            {isKnockoutMatch && match.stage && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {KNOCKOUT_STAGE_LABELS[match.stage] ?? match.stage}
              </span>
            )}
          </div>
          <ChevronRight
            size={16}
            className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <TeamAvatar team={match.home_team} size="lg" />
            <span className="text-foreground text-sm font-medium truncate">{match.home_team.name}</span>
          </div>
          <span className="text-muted-foreground text-xs font-bold px-3 shrink-0">VS</span>
          <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
            <span className="text-foreground text-sm font-medium truncate text-right">{match.away_team.name}</span>
            <TeamAvatar team={match.away_team} size="lg" />
          </div>
        </div>
        {match.location && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
            <MapPin size={12} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs truncate">{match.location}</span>
          </div>
        )}
      </Link>
      {(canManageSchedule && tournamentId) || showAssignTeams ? (
        <div
          className="px-4 pb-4 pt-3 border-t border-border flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {canManageSchedule && tournamentId && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAssignForm(false);
                setShowScheduleForm(true);
              }}
              className="flex items-center gap-2 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <CalendarPlus size={14} />
              Set date & time
            </button>
          )}
          {showAssignTeams && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowScheduleForm(false);
                setShowAssignForm(true);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors ml-auto"
            >
              <UserPlus size={12} />
              Assign teams
            </button>
          )}
        </div>
      ) : null}
      {showScheduleForm && canManageSchedule && tournamentId && (
        <div className="px-4 py-3 border-t border-border" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          <ScheduleTournamentMatchForm
            matchId={match.id}
            tournamentId={tournamentId}
            currentDate={match.date}
            currentTime={match.time}
            currentLocation={match.location}
            onClose={() => setShowScheduleForm(false)}
          />
        </div>
      )}
      {showAssignTeams && showAssignForm && (
        <div className="px-4 py-3 border-t border-border" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          <AssignTeamsToMatchForm
            matchId={match.id}
            tournamentId={tournamentId}
            stage={match.stage}
            homeTeamId={match.home_team_id}
            awayTeamId={match.away_team_id}
            advancingTeams={advancingTeams}
            knockoutMatches={knockoutMatches}
            onSuccess={() => {
              setShowAssignForm(false);
              onAssignSuccess?.();
            }}
            onCancel={() => setShowAssignForm(false)}
          />
        </div>
      )}
    </div>
  );
}

interface TournamentFixturesProps {
  matches: (Match & { stage?: string })[];
  tournamentId?: string;
  canManageSchedule?: boolean;
  canManageKnockout?: boolean;
  knockoutMatches?: TournamentMatchWithStage[];
  advancingTeams?: { id: string; name: string; short_name: string }[];
  onAssignSuccess?: () => void;
  userTeamId?: string | null;
}

export function TournamentFixtures({
  matches,
  tournamentId,
  canManageSchedule,
  canManageKnockout,
  knockoutMatches = [],
  advancingTeams = [],
  onAssignSuccess,
  userTeamId,
}: TournamentFixturesProps) {
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const completed = matches.filter((m) => m.status === "completed");

  const fixtureProps = {
    tournamentId,
    canManageSchedule,
    canManageKnockout,
    knockoutMatches,
    advancingTeams,
    onAssignSuccess,
  };

  return (
    <section className="tournament-fixtures px-5">
      <div className="tournament-fixtures__header flex items-center justify-between mb-3">
        <h2 className="tournament-fixtures__title text-foreground font-semibold text-base">Fixtures</h2>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
        <div className="flex flex-col gap-6 p-4">
          {live.length > 0 && (
            <div className="tournament-fixtures__subsection">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Now</h3>
              <div className="flex flex-col gap-3">
                {live.map((match) => (
                  <UpcomingFixture key={match.id} match={match} {...fixtureProps} />
                ))}
              </div>
            </div>
          )}
          <div className="tournament-fixtures__subsection">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Next Fixtures</h3>
            {upcoming.length > 0 ? (
              <div className="flex flex-col gap-3">
                {upcoming.map((match) => (
                  <UpcomingFixture key={match.id} match={match} {...fixtureProps} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-6">No fixtures scheduled yet</p>
            )}
          </div>
          <div className="tournament-fixtures__subsection">
            <RecentResults
              matches={matches}
              teamId={userTeamId}
              variant="embedded"
              maxItems={undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

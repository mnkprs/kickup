"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { UNKNOWN_PLAYER_ID } from "@/lib/constants";
import type { Match } from "@/lib/types";
import type { RosterPlayer } from "./match-detail-types";

interface RosterColumnProps {
  roster: RosterPlayer[];
  team: Match["home_team"];
  teamGoals: Record<string, number>;
  guestIds?: Set<string>;
}

function RosterColumn({ roster, team, teamGoals, guestIds }: RosterColumnProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <TeamAvatar
          avatar_url={team.avatar_url}
          emoji={team.emoji}
          short_name={team.short_name}
          name={team.name}
          color={team.color}
          size="2xs"
        />
        <span className="text-sm font-semibold text-foreground truncate">{team.name}</span>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card divide-y divide-border overflow-hidden">
        {roster.length === 0 && (teamGoals[UNKNOWN_PLAYER_ID] ?? 0) === 0 ? (
          <div className="px-4 py-3 text-muted-foreground text-xs">No roster data</div>
        ) : null}
        {roster.map(({ player_id, profile }) => {
          const goals = teamGoals[player_id] ?? 0;
          const name = (profile.full_name as string) ?? "Unknown";
          const isGuest = guestIds?.has(player_id);
          return (
            <Link
              key={player_id}
              href={`/profile/${player_id}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors pressable"
            >
              <div className="flex items-center gap-3 min-w-0">
                {isGuest && (
                  <span className="text-muted-foreground text-[10px] font-medium shrink-0">(Guest)</span>
                )}
                <Avatar
                  avatar_url={profile.avatar_url as string | null}
                  avatar_initials={(profile.avatar_initials as string) || name.split(" ").map((n) => n[0]).join("")}
                  avatar_color={(profile.avatar_color as string) ?? "#2E7D32"}
                  full_name={name}
                  size="2xs"
                />
                <span className="text-sm font-medium text-foreground truncate">{name}</span>
              </div>
              {goals > 0 && (
                <span className="text-draw font-bold text-sm shrink-0">{goals} ⚽</span>
              )}
            </Link>
          );
        })}
        {(teamGoals[UNKNOWN_PLAYER_ID] ?? 0) > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                avatar_url={null}
                avatar_initials="?"
                avatar_color="#9E9E9E"
                full_name="Unknown"
                size="2xs"
              />
              <span className="text-sm font-medium text-muted-foreground truncate">Unknown</span>
            </div>
            <span className="text-draw font-bold text-sm shrink-0">{teamGoals[UNKNOWN_PLAYER_ID]} ⚽</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MatchRostersSectionProps {
  homeRoster: RosterPlayer[];
  awayRoster: RosterPlayer[];
  homeTeam: Match["home_team"];
  awayTeam: Match["away_team"];
  goalsByPlayer: Record<string, number>;
  goalsByTeam?: { home: Record<string, number>; away: Record<string, number> };
  homeGuestIds?: string[];
  awayGuestIds?: string[];
}

export function MatchRostersSection({
  homeRoster,
  awayRoster,
  homeTeam,
  awayTeam,
  goalsByPlayer,
  goalsByTeam,
  homeGuestIds = [],
  awayGuestIds = [],
}: MatchRostersSectionProps) {
  const hasGoalsByTeam = goalsByTeam && (Object.keys(goalsByTeam.home ?? {}).length > 0 || Object.keys(goalsByTeam.away ?? {}).length > 0);
  const homeGoals = hasGoalsByTeam
    ? (goalsByTeam!.home ?? {})
    : (() => {
        const rosterEntries = homeRoster
          .filter((p) => (goalsByPlayer[p.player_id] ?? 0) > 0)
          .map((p) => [p.player_id, goalsByPlayer[p.player_id] ?? 0] as const);
        const unknownCount = goalsByPlayer[UNKNOWN_PLAYER_ID] ?? 0;
        return Object.fromEntries(
          unknownCount > 0 ? [...rosterEntries, [UNKNOWN_PLAYER_ID, unknownCount] as const] : rosterEntries
        );
      })();
  const awayGoals = hasGoalsByTeam
    ? (goalsByTeam!.away ?? {})
    : (() => {
        const rosterEntries = awayRoster
          .filter((p) => (goalsByPlayer[p.player_id] ?? 0) > 0)
          .map((p) => [p.player_id, goalsByPlayer[p.player_id] ?? 0] as const);
        return Object.fromEntries(rosterEntries);
      })();
  const homeGuestSet = new Set(homeGuestIds);
  const awayGuestSet = new Set(awayGuestIds);

  return (
    <section className="match-rosters-section px-5">
      <h2 className="match-rosters-section__title text-foreground font-semibold text-sm mb-3">Team Rosters</h2>
      <div className="flex flex-col gap-4">
        <RosterColumn roster={homeRoster} team={homeTeam} teamGoals={homeGoals} guestIds={homeGuestSet} />
        <RosterColumn roster={awayRoster} team={awayTeam} teamGoals={awayGoals} guestIds={awayGuestSet} />
      </div>
    </section>
  );
}

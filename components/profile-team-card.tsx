import type { Profile, Team } from "@/lib/types";
import { ChevronRight, Users, MapPin, Trophy, Crown } from "lucide-react";
import Link from "next/link";
import { SearchingToggle } from "@/components/searching-toggle";
import { TeamAvatar } from "@/components/team-avatar";
import { LookingForPlayersToggle } from "@/components/looking-for-players-toggle";

interface ProfileTeamCardProps {
  profile: Profile;
  team: Team | null;
  /** Show captain toggles (Looking for Opponent, Looking for Players) when viewing own profile */
  showCaptainToggles?: boolean;
}

export function ProfileTeamCard({ profile, team, showCaptainToggles = false }: ProfileTeamCardProps) {
  if (!team) return null;

  const isCaptain = team.captain_id === profile.id;
  const totalMatches = team.wins + team.losses + team.draws;

  return (
    <section className="profile-team-card">
      <div className="profile-team-card__header flex items-center justify-between mb-3">
        <h2 className="profile-team-card__title text-foreground font-semibold text-sm">My Team</h2>
        <Link href="/teams" className="text-accent text-xs font-medium hover:underline">
          All teams
        </Link>
      </div>
      <Link href={`/teams/${team.id}`} className="profile-team-card__link">
        <div
          className="profile-team-card__card rounded-xl p-4 cursor-pointer group transition-all hover:shadow-lg bg-gradient-accent pressable"
        >
          <div className="profile-team-card__card-header flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <TeamAvatar
                team={team}
                size="lg"
                className="ring-2 ring-accent-foreground/20"
              />
              <div>
                <h3 className="text-accent-foreground font-semibold text-sm">{team.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {isCaptain && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-draw">
                      <Crown size={10} fill="currentColor" />
                      Captain
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-accent-foreground/50 group-hover:text-accent-foreground transition-colors"
            />
          </div>

          <div className="profile-team-card__meta grid grid-cols-3 gap-3">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-accent-foreground/60" />
              <span className="text-accent-foreground/70 text-xs">{team.area}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-accent-foreground/60" />
              <span className="text-accent-foreground/70 text-xs">
                {team.open_spots === 0 ? "Full" : `${team.open_spots} spots`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy size={12} className="text-accent-foreground/60" />
              <span className="text-accent-foreground/70 text-xs">{totalMatches} played</span>
            </div>
          </div>

          <div className="profile-team-card__record flex items-center gap-3 mt-3 pt-3 border-t border-accent-foreground/10">
            <span className="text-accent-foreground/80 text-xs">
              <span className="font-bold text-accent-foreground">{team.wins}</span>W
            </span>
            <span className="text-accent-foreground/80 text-xs">
              <span className="font-bold text-accent-foreground">{team.draws}</span>D
            </span>
            <span className="text-accent-foreground/80 text-xs">
              <span className="font-bold text-accent-foreground">{team.losses}</span>L
            </span>
            <span className="ml-auto text-accent-foreground font-bold text-sm">
              {team.points} pts
            </span>
          </div>
        </div>
      </Link>

      {showCaptainToggles && isCaptain && (
        <div className="profile-team-card__toggles flex items-center gap-2 mt-3">
          <SearchingToggle
            teamId={team.id}
            initial={team.searching_for_opponent ?? false}
          />
          <LookingForPlayersToggle
            teamId={team.id}
            initial={team.searching_for_players ?? false}
          />
        </div>
      )}
    </section>
  );
}

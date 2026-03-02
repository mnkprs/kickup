import { createClient } from "@/lib/supabase/server";
import { getTeam, getTeamMembers, getPendingJoinRequests } from "@/lib/db/teams";
import { getMatchesForTeam } from "@/lib/db/matches";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
  removeMemberAction,
} from "@/app/actions/teams";
import type { Team, Profile, Match, TeamMember } from "@/lib/types";
import {
  ArrowLeft,
  MapPin,
  Users,
  Crown,
  ChevronRight,
  Shield,
  Crosshair,
  Handshake,
  Swords,
  Trophy,
  ShieldAlert,
  Star,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import { JoinTeamButton } from "@/components/join-team-button";
import { SearchingToggle } from "@/components/searching-toggle";
import { TeamCaptainControlsWrapper } from "@/components/team-captain-controls-wrapper";

const positionOrder: Record<string, number> = {
  GK: 0, CB: 1, LB: 2, RB: 3, CDM: 4, CM: 5, CAM: 6,
  LW: 7, RW: 8, LM: 9, RM: 10, CF: 11, ST: 12,
};

function posSort(a: Profile, b: Profile) {
  const pa = positionOrder[a.position ?? ""] ?? 99;
  const pb = positionOrder[b.position ?? ""] ?? 99;
  return pa - pb;
}

function TeamStatsGrid({ team }: { team: Team }) {
  const total = team.wins + team.draws + team.losses;
  const gd = team.goals_for - team.goals_against;
  const winRate = total > 0 ? Math.round((team.wins / total) * 100) : 0;
  const stats = [
    { label: "Played", value: total, icon: Swords, iconClass: "text-muted-foreground", bgClass: "bg-muted" },
    { label: "Wins", value: team.wins, icon: Trophy, iconClass: "text-win", bgClass: "bg-win/10" },
    { label: "Goals", value: team.goals_for, icon: Crosshair, iconClass: "text-draw", bgClass: "bg-draw/10" },
    { label: "Win %", value: `${winRate}`, icon: Shield, iconClass: "text-info", bgClass: "bg-info/10" },
    { label: "GD", value: gd > 0 ? `+${gd}` : `${gd}`, icon: Star, iconClass: gd >= 0 ? "text-win" : "text-loss", bgClass: gd >= 0 ? "bg-win/10" : "bg-loss/10" },
  ];

  return (
    <section className="px-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">Team Stats</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border px-2 py-3"
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.bgClass}`}>
              <stat.icon size={16} className={stat.iconClass} />
            </div>
            <span className="text-foreground font-bold text-lg leading-none">
              {stat.value}
            </span>
            <span className="text-muted-foreground text-[11px] leading-none">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RosterSection({ members, captainId }: { members: Profile[]; captainId: string | null | undefined }) {
  const roster = [...members].sort(posSort);

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-sm">Roster</h2>
        <span className="text-muted-foreground text-xs">{roster.length} players</span>
      </div>
      <div className="rounded-xl bg-card border border-border divide-y divide-border">
        {roster.map((player) => {
          const isCaptain = captainId === player.id;
          const initials = player.avatar_initials || player.full_name.split(" ").map((n) => n[0]).join("");
          return (
            <Link
              key={player.id}
              href={`/profile/${player.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${player.avatar_color}20` }}
              >
                <span className="text-foreground font-semibold text-xs">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground text-sm font-medium truncate">{player.full_name}</span>
                  {isCaptain && (
                    <Crown size={11} className="text-draw shrink-0" fill="currentColor" />
                  )}
                </div>
                <span className="text-muted-foreground text-xs">{player.position ?? "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                <span title="Goals">
                  <Crosshair size={11} className="inline mr-0.5 text-draw" />
                  {player.goals}
                </span>
                <span title="Assists">
                  <Handshake size={11} className="inline mr-0.5 text-info" />
                  {player.assists}
                </span>
                <span title="Cards">
                  <ShieldAlert size={11} className="inline mr-0.5 text-warning" />
                  {player.yellow_cards + player.red_cards}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TeamMatchesSection({ matches, team, title }: { matches: Match[]; team: Team; title: string }) {
  if (matches.length === 0) return null;

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-sm">{title}</h2>
        <span className="text-muted-foreground text-xs">{matches.length} scheduled</span>
      </div>
      <div className="flex flex-col gap-3">
        {matches.slice(0, 4).map((match) => {
          const isHome = match.home_team_id === team.id;
          const opponent = isHome ? match.away_team : match.home_team;

          if (match.status === "upcoming") {
            return (
              <Link key={match.id} href={`/matches/${match.id}`} className="rounded-xl bg-card border border-border p-4 hover:border-accent/40 transition-colors block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {isHome ? "Home" : "Away"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {match.date ? format(parseISO(match.date), "d MMM") : "TBC"}
                    {match.time ? ` · ${match.time.slice(0, 5)}` : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-foreground font-bold text-xs">{team.short_name}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">vs</span>
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-foreground font-bold text-xs">{opponent.short_name}</span>
                    </div>
                    <span className="text-foreground text-sm font-medium">{opponent.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
                {match.location && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <MapPin size={11} className="text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">{match.location}</span>
                  </div>
                )}
              </Link>
            );
          }

          // Completed match
          const ours = isHome ? match.home_score! : match.away_score!;
          const theirs = isHome ? match.away_score! : match.home_score!;
          const result = ours > theirs ? "W" : ours < theirs ? "L" : "D";
          const resultColor =
            result === "W" ? "bg-win/15 text-win" : result === "L" ? "bg-loss/15 text-loss" : "bg-draw/15 text-draw";

          return (
            <Link key={match.id} href={`/matches/${match.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors block">
              <span className={`h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold ${resultColor}`}>
                {result}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-foreground text-sm font-medium block truncate">
                  {isHome ? "vs" : "@"} {opponent.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {match.date ? format(parseISO(match.date), "d MMM yyyy") : ""}
                </span>
              </div>
              <span className="text-foreground font-bold text-sm shrink-0">{ours}-{theirs}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [team, memberRows, pendingRequests, allMatches] = await Promise.all([
    getTeam(id),
    getTeamMembers(id),
    getPendingJoinRequests(id),
    getMatchesForTeam(id),
  ]);

  if (!team) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Team not found</p>
      </div>
    );
  }

  const members = memberRows.map((m) => m.profile);
  const upcomingMatches = allMatches.filter((m) => m.status === "upcoming");
  const completedMatches = allMatches.filter((m) => m.status === "completed");

  const isMyTeam = memberRows.some((m) => m.player_id === user?.id);
  const isCaptain = team.captain_id === user?.id;

  // Check if user already has a pending join request
  let hasPendingRequest = false;
  let userHasAnyTeam = false;
  if (user && !isMyTeam) {
    const [{ data: pendingRow }, { data: anyMembership }] = await Promise.all([
      supabase.from("team_members").select("id").eq("team_id", id).eq("player_id", user.id).eq("status", "pending").maybeSingle(),
      supabase.from("team_members").select("id").eq("player_id", user.id).maybeSingle(),
    ]);
    hasPendingRequest = !!pendingRow;
    userHasAnyTeam = !!anyMembership;
  }

  const totalMatches = team.wins + team.draws + team.losses;
  const winRate = totalMatches > 0 ? Math.round((team.wins / totalMatches) * 100) : 0;

  return (
    <>
      {/* Header */}
      <header className="px-5 pt-12 pb-2">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/teams"
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
            >
              <ArrowLeft size={18} className="text-muted-foreground" />
            </Link>
            <h1 className="text-foreground font-semibold text-lg">Team Detail</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Team hero card */}
        <div
          className={`rounded-xl p-5 ${
            isMyTeam
              ? "bg-gradient-accent"
              : "bg-gradient-to-br from-muted to-card border border-border"
          }`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`h-16 w-16 rounded-full flex items-center justify-center ${
                isMyTeam
                  ? "bg-accent-foreground/10 ring-2 ring-accent-foreground/20"
                  : "bg-muted ring-2 ring-border"
              }`}
            >
              <span className={`font-bold text-lg ${isMyTeam ? "text-accent-foreground" : "text-foreground"}`}>
                {team.short_name}
              </span>
            </div>
            <div>
              <h2 className={`font-bold text-xl ${isMyTeam ? "text-accent-foreground" : "text-foreground"}`}>
                {team.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isMyTeam && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-accent bg-accent-foreground/10 px-1.5 py-0.5 rounded-full">
                    My team
                  </span>
                )}
                {isCaptain && (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-draw">
                    <Crown size={10} fill="currentColor" />
                    Captain
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className={isMyTeam ? "text-accent-foreground/60" : "text-muted-foreground"} />
              <span className={`text-xs ${isMyTeam ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                {team.area}
              </span>
            </div>
            {team.home_ground && (
              <div className="flex items-center gap-1.5">
                <Shield size={12} className={isMyTeam ? "text-accent-foreground/60" : "text-muted-foreground"} />
                <span className={`text-xs ${isMyTeam ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                  {team.home_ground}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users size={12} className={isMyTeam ? "text-accent-foreground/60" : "text-muted-foreground"} />
              <span className={`text-xs ${isMyTeam ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                {members.length} players
              </span>
            </div>
          </div>

          <div className={`flex items-center gap-3 pt-3 border-t ${isMyTeam ? "border-accent-foreground/10" : "border-border"}`}>
            <span className={`text-xs ${isMyTeam ? "text-accent-foreground/80" : "text-muted-foreground"}`}>
              <span className={`font-bold ${isMyTeam ? "text-accent-foreground" : "text-win"}`}>{team.wins}</span>W
            </span>
            <span className={`text-xs ${isMyTeam ? "text-accent-foreground/80" : "text-muted-foreground"}`}>
              <span className={`font-bold ${isMyTeam ? "text-accent-foreground" : "text-draw"}`}>{team.draws}</span>D
            </span>
            <span className={`text-xs ${isMyTeam ? "text-accent-foreground/80" : "text-muted-foreground"}`}>
              <span className={`font-bold ${isMyTeam ? "text-accent-foreground" : "text-loss"}`}>{team.losses}</span>L
            </span>
            <span className={`ml-auto font-bold text-sm ${isMyTeam ? "text-accent-foreground" : "text-foreground"}`}>
              {winRate}% win
            </span>
          </div>
        </div>

        {/* Actions row */}
        {user && (
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {isCaptain && (
              <SearchingToggle
                teamId={team.id}
                initial={team.searching_for_opponent ?? false}
              />
            )}
            {!isMyTeam && !userHasAnyTeam && team.open_spots > 0 && (
              <JoinTeamButton
                teamId={team.id}
                hasPendingRequest={hasPendingRequest}
                isAlreadyMember={false}
              />
            )}
          </div>
        )}
      </header>

      <main className="flex flex-col gap-6 pt-4 pb-24">
        <TeamStatsGrid team={team} />
        <RosterSection members={members} captainId={team.captain_id} />
        {isCaptain && (
          <TeamCaptainControlsWrapper
            pendingRequests={pendingRequests}
            activeMembers={memberRows}
            teamId={team.id}
            myPlayerId={user!.id}
          />
        )}
        <TeamMatchesSection matches={upcomingMatches} team={team} title="Upcoming Matches" />
        <TeamMatchesSection matches={completedMatches} team={team} title="Recent Results" />
      </main>

    </>
  );
}

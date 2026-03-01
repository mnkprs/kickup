"use client";

import { use, useMemo } from "react";
import {
  teams,
  matches,
  currentUser,
  teammates,
  type Team,
  type Profile,
} from "@/lib/mock-data";
import { BottomNav } from "@/components/bottom-nav";
import {
  ArrowLeft,
  MapPin,
  Calendar,
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

/* ------------------------------------------------------------------ */
/*  Roster positions sorted by pitch position                          */
/* ------------------------------------------------------------------ */
const positionOrder: Record<string, number> = {
  GK: 0,
  CB: 1,
  LB: 2,
  RB: 3,
  CDM: 4,
  CM: 5,
  CAM: 6,
  LW: 7,
  RW: 8,
  LM: 9,
  RM: 10,
  CF: 11,
  ST: 12,
};

function posSort(a: Profile, b: Profile) {
  const pa = positionOrder[a.position ?? ""] ?? 99;
  const pb = positionOrder[b.position ?? ""] ?? 99;
  return pa - pb;
}

/* ------------------------------------------------------------------ */
/*  Team stats grid — mirrors QuickStats / ProfileStats pattern        */
/* ------------------------------------------------------------------ */
function TeamStatsGrid({ team }: { team: Team }) {
  const total = team.wins + team.draws + team.losses;
  const gd = team.goals_for - team.goals_against;
  const winRate = total > 0 ? Math.round((team.wins / total) * 100) : 0;
  const stats = [
    { label: "Played", value: total, icon: Swords, color: "#A3A3A3" },
    { label: "Wins", value: team.wins, icon: Trophy, color: "#2E7D32" },
    { label: "Goals", value: team.goals_for, icon: Crosshair, color: "#F9A825" },
    { label: "Win %", value: `${winRate}`, icon: Shield, color: "#42A5F5" },
    { label: "GD", value: gd > 0 ? `+${gd}` : `${gd}`, icon: Star, color: gd >= 0 ? "#2E7D32" : "#D32F2F" },
    { label: "Points", value: team.points, icon: Trophy, color: "#F9A825" },
  ];

  return (
    <section className="px-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">
        Team Stats
      </h2>
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border px-2 py-3"
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon size={16} style={{ color: stat.color }} />
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

/* ------------------------------------------------------------------ */
/*  Roster list                                                        */
/* ------------------------------------------------------------------ */
function RosterSection({ team }: { team: Team }) {
  const roster = useMemo(
    () => [...(team.members ?? teammates)].sort(posSort),
    [team.members]
  );

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-sm">Roster</h2>
        <span className="text-muted-foreground text-xs">
          {roster.length} players
        </span>
      </div>
      <div className="rounded-xl bg-card border border-border divide-y divide-border">
        {roster.map((player) => {
          const isCaptain = team.captain_id === player.id;
          const initials = player.full_name
            .split(" ")
            .map((n) => n[0])
            .join("");
          return (
            <div
              key={player.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-foreground font-semibold text-xs">
                  {initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground text-sm font-medium truncate">
                    {player.full_name}
                  </span>
                  {isCaptain && (
                    <Crown
                      size={11}
                      className="text-draw shrink-0"
                      fill="currentColor"
                    />
                  )}
                </div>
                <span className="text-muted-foreground text-xs">
                  {player.position ?? "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                <span title="Goals">
                  <Crosshair
                    size={11}
                    className="inline mr-0.5 text-draw"
                  />
                  {player.goals}
                </span>
                <span title="Assists">
                  <Handshake
                    size={11}
                    className="inline mr-0.5 text-[#42A5F5]"
                  />
                  {player.assists}
                </span>
                <span title="Cards">
                  <ShieldAlert
                    size={11}
                    className="inline mr-0.5 text-[#E65100]"
                  />
                  {(player.yellow_cards ?? 0) + (player.red_cards ?? 0)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Upcoming matches for this team                                     */
/* ------------------------------------------------------------------ */
function TeamUpcomingMatches({ team }: { team: Team }) {
  const upcoming = matches.filter(
    (m) =>
      m.status === "upcoming" &&
      (m.home_team.id === team.id || m.away_team.id === team.id)
  );

  if (upcoming.length === 0) return null;

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-sm">
          Upcoming Matches
        </h2>
        <span className="text-muted-foreground text-xs">
          {upcoming.length} scheduled
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {upcoming.map((match) => {
          const isHome = match.home_team.id === team.id;
          const opponent = isHome ? match.away_team : match.home_team;
          return (
            <div
              key={match.id}
              className="rounded-xl bg-card border border-border p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isHome ? "Home" : "Away"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {format(parseISO(match.date), "d MMM")} &middot; {match.time}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-foreground font-bold text-xs">
                      {team.short_name}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-sm">vs</span>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-foreground font-bold text-xs">
                      {opponent.short_name}
                    </span>
                  </div>
                  <span className="text-foreground text-sm font-medium">
                    {opponent.name}
                  </span>
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>

              <div className="flex items-center gap-1.5 mt-2">
                <MapPin size={11} className="text-muted-foreground" />
                <span className="text-muted-foreground text-xs">
                  {match.location}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent results for this team                                       */
/* ------------------------------------------------------------------ */
function TeamRecentResults({ team }: { team: Team }) {
  const completed = matches.filter(
    (m) =>
      m.status === "completed" &&
      (m.home_team.id === team.id || m.away_team.id === team.id)
  );

  if (completed.length === 0) return null;

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-sm">
          Recent Results
        </h2>
      </div>
      <div className="rounded-xl bg-card border border-border divide-y divide-border">
        {completed.slice(0, 4).map((match) => {
          const isHome = match.home_team.id === team.id;
          const ours = isHome ? match.home_score! : match.away_score!;
          const theirs = isHome ? match.away_score! : match.home_score!;
          const opponent = isHome ? match.away_team : match.home_team;
          const result =
            ours > theirs ? "W" : ours < theirs ? "L" : "D";
          const resultColor =
            result === "W"
              ? "bg-win/15 text-win"
              : result === "L"
                ? "bg-loss/15 text-loss"
                : "bg-draw/15 text-draw";

          return (
            <div
              key={match.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span
                className={`h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold ${resultColor}`}
              >
                {result}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-foreground text-sm font-medium block truncate">
                  {isHome ? "vs" : "@"} {opponent.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {format(parseISO(match.date), "d MMM yyyy")}
                </span>
              </div>
              <span className="text-foreground font-bold text-sm shrink-0">
                {ours}-{theirs}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const team = teams.find((t) => t.id === id);

  if (!team) {
    return (
      <div className="min-h-dvh bg-background max-w-lg mx-auto flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Team not found</p>
      </div>
    );
  }

  const totalMatches = team.wins + team.draws + team.losses;
  const winRate =
    totalMatches > 0 ? Math.round((team.wins / totalMatches) * 100) : 0;
  const memberCount = team.members?.length ?? 0;
  const isMyTeam = team.id === currentUser.team_id;
  const isCaptain = team.captain_id === currentUser.id;

  return (
    <div className="min-h-dvh bg-background max-w-lg mx-auto relative">
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
            <h1 className="text-foreground font-semibold text-lg">
              Team Detail
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Team hero card */}
        <div
          className={`rounded-xl p-5 ${
            isMyTeam
              ? "bg-gradient-to-br from-[#1B5E20] to-[#2E7D32]"
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
              <span
                className={`font-bold text-lg ${
                  isMyTeam ? "text-accent-foreground" : "text-foreground"
                }`}
              >
                {team.short_name}
              </span>
            </div>
            <div>
              <h2
                className={`font-bold text-xl ${
                  isMyTeam ? "text-accent-foreground" : "text-foreground"
                }`}
              >
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

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
            <div className="flex items-center gap-1.5">
              <MapPin
                size={12}
                className={
                  isMyTeam
                    ? "text-accent-foreground/60"
                    : "text-muted-foreground"
                }
              />
              <span
                className={`text-xs ${
                  isMyTeam
                    ? "text-accent-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {team.area}
              </span>
            </div>
            {team.home_ground && (
              <div className="flex items-center gap-1.5">
                <Shield
                  size={12}
                  className={
                    isMyTeam
                      ? "text-accent-foreground/60"
                      : "text-muted-foreground"
                  }
                />
                <span
                  className={`text-xs ${
                    isMyTeam
                      ? "text-accent-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {team.home_ground}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users
                size={12}
                className={
                  isMyTeam
                    ? "text-accent-foreground/60"
                    : "text-muted-foreground"
                }
              />
              <span
                className={`text-xs ${
                  isMyTeam
                    ? "text-accent-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {memberCount} players
              </span>
            </div>
            {team.founded && (
              <div className="flex items-center gap-1.5">
                <Calendar
                  size={12}
                  className={
                    isMyTeam
                      ? "text-accent-foreground/60"
                      : "text-muted-foreground"
                  }
                />
                <span
                  className={`text-xs ${
                    isMyTeam
                      ? "text-accent-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  Est. {team.founded}
                </span>
              </div>
            )}
          </div>

          {/* Record */}
          <div
            className={`flex items-center gap-3 pt-3 border-t ${
              isMyTeam
                ? "border-accent-foreground/10"
                : "border-border"
            }`}
          >
            <span
              className={`text-xs ${
                isMyTeam
                  ? "text-accent-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`font-bold ${
                  isMyTeam ? "text-accent-foreground" : "text-win"
                }`}
              >
                {team.wins}
              </span>
              W
            </span>
            <span
              className={`text-xs ${
                isMyTeam
                  ? "text-accent-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`font-bold ${
                  isMyTeam ? "text-accent-foreground" : "text-draw"
                }`}
              >
                {team.draws}
              </span>
              D
            </span>
            <span
              className={`text-xs ${
                isMyTeam
                  ? "text-accent-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              <span
                className={`font-bold ${
                  isMyTeam ? "text-accent-foreground" : "text-loss"
                }`}
              >
                {team.losses}
              </span>
              L
            </span>
            <span
              className={`ml-auto font-bold text-sm ${
                isMyTeam ? "text-accent-foreground" : "text-foreground"
              }`}
            >
              {winRate}% win
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-6 pt-4 pb-24">
        <TeamStatsGrid team={team} />
        <RosterSection team={team} />
        <TeamUpcomingMatches team={team} />
        <TeamRecentResults team={team} />
      </main>

      <BottomNav />
    </div>
  );
}

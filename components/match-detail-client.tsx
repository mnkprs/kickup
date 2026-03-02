"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Calendar, Check, ChevronRight, Trophy, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { NotificationsButton } from "@/components/notifications-button";
import type { Match } from "@/lib/types";
import {
  acceptChallengeAction,
  declineChallengeAction,
  setMatchTimeAction,
  submitResultAction,
  organizerSubmitResultAction,
} from "@/app/actions/matches";
import { LiveDot } from "@/components/live-dot";
import { Avatar } from "@/components/avatar";

interface TeamMemberMin {
  id: string;
  full_name: string;
  avatar_initials: string;
  avatar_color: string;
  avatar_url: string | null;
}

interface RosterPlayer {
  player_id: string;
  profile: Record<string, unknown>;
}

interface MatchDetailClientProps {
  match: Match;
  userTeamId: string | null;
  teamMembers: TeamMemberMin[];
  homeRoster?: RosterPlayer[];
  awayRoster?: RosterPlayer[];
  goalsByPlayer?: Record<string, number>;
  isTournamentOrganizer?: boolean;
}

function TeamBlock({
  teamId,
  emoji,
  color,
  shortName,
  name,
  score,
  isWinner,
}: {
  teamId: string;
  emoji?: string;
  color?: string;
  shortName: string;
  name: string;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <Link
      href={`/teams/${teamId}`}
      className="flex flex-col items-center gap-2 flex-1 hover:opacity-90 transition-opacity"
    >
      <div
        className="h-16 w-16 rounded-full flex items-center justify-center border border-border text-2xl"
        style={color ? { backgroundColor: color + "33" } : undefined}
      >
        {emoji ? (
          <span>{emoji}</span>
        ) : (
          <span className="text-foreground font-bold text-sm">{shortName}</span>
        )}
      </div>
      <span
        className={`text-sm font-medium text-center leading-tight ${
          isWinner ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {name}
      </span>
      {score !== null && (
        <span
          className={`text-4xl font-bold ${
            isWinner ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {score}
        </span>
      )}
    </Link>
  );
}

function GoalsRosterSection({
  roster,
  team,
  goals,
  onUpdate,
}: {
  roster: RosterPlayer[];
  team: Match["home_team"];
  goals: Record<string, number>;
  onUpdate: (playerId: string, delta: number) => void;
}) {
  return (
    <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center border border-border text-xs font-bold"
          style={team.color ? { backgroundColor: team.color + "33" } : undefined}
        >
          {team.emoji || team.short_name}
        </div>
        <span className="text-xs font-semibold text-foreground">{team.name}</span>
      </div>
      <div className="divide-y divide-border">
        {roster.map(({ player_id, profile }) => {
          const count = goals[player_id] ?? 0;
          const name = (profile.full_name as string) ?? "Unknown";
          return (
            <div
              key={player_id}
              className="flex items-center gap-2 px-4 py-2.5"
            >
              <button
                type="button"
                onClick={() => onUpdate(player_id, -1)}
                disabled={count <= 0}
                className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors pressable shrink-0"
                aria-label={`Remove goal from ${name}`}
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <Avatar
                avatar_url={profile.avatar_url as string | null}
                avatar_initials={(profile.avatar_initials as string) || name.split(" ").map((n) => n[0]).join("")}
                avatar_color={(profile.avatar_color as string) ?? "#2E7D32"}
                full_name={name}
                size="2xs"
              />
              <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                {name}
              </span>
              <span className="text-sm font-bold text-draw tabular-nums w-6 text-center shrink-0">
                {count}
              </span>
              <button
                type="button"
                onClick={() => onUpdate(player_id, 1)}
                className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors pressable shrink-0"
                aria-label={`Add goal for ${name}`}
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchRostersSection({
  homeRoster,
  awayRoster,
  homeTeam,
  awayTeam,
  goalsByPlayer,
}: {
  homeRoster: RosterPlayer[];
  awayRoster: RosterPlayer[];
  homeTeam: Match["home_team"];
  awayTeam: Match["away_team"];
  goalsByPlayer: Record<string, number>;
}) {
  function RosterColumn({
    roster,
    team,
  }: {
    roster: RosterPlayer[];
    team: Match["home_team"];
  }) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center border border-border text-xs font-bold"
            style={team.color ? { backgroundColor: team.color + "33" } : undefined}
          >
            {team.emoji || team.short_name}
          </div>
          <span className="text-sm font-semibold text-foreground truncate">{team.name}</span>
        </div>
        <div className="rounded-xl bg-card border border-border shadow-card divide-y divide-border overflow-hidden">
          {roster.length === 0 ? (
            <div className="px-4 py-3 text-muted-foreground text-xs">No roster data</div>
          ) : (
            roster.map(({ player_id, profile }) => {
              const goals = goalsByPlayer[player_id] ?? 0;
              const name = (profile.full_name as string) ?? "Unknown";
              return (
                <Link
                  key={player_id}
                  href={`/profile/${player_id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors pressable"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="px-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">Team Rosters</h2>
      <div className="flex gap-4">
        <RosterColumn roster={homeRoster} team={homeTeam} />
        <RosterColumn roster={awayRoster} team={awayTeam} />
      </div>
    </section>
  );
}

export function MatchDetailClient({
  match,
  userTeamId,
  teamMembers,
  homeRoster = [],
  awayRoster = [],
  goalsByPlayer = {},
  isTournamentOrganizer = false,
}: MatchDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Scheduling state
  const [matchDate, setMatchDate] = useState(match.date ?? "");
  const [matchTime, setMatchTime] = useState(match.time?.slice(0, 5) ?? "");
  const [matchLocation, setMatchLocation] = useState(match.location ?? "");

  // Result state
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() ?? "0");
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() ?? "0");
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [formGoalsByPlayer, setFormGoalsByPlayer] = useState<Record<string, number>>({});

  const rawStatus = match.raw_status;
  const isCompleted = rawStatus === "completed";
  const isPendingChallenge = rawStatus === "pending_challenge";
  const isScheduling = rawStatus === "scheduling";
  const isPreMatch = rawStatus === "pre_match";

  const isAwayTeam = userTeamId === match.away_team_id;
  const isParticipant = userTeamId !== null;
  const canSubmitResult = isParticipant || isTournamentOrganizer;

  const homeWin = isCompleted && match.home_score! > match.away_score!;
  const awayWin = isCompleted && match.away_score! > match.home_score!;

  const isLive = match.status === "live";
  const statusLabel = isLive
    ? "Live"
    : {
        pending_challenge: "Challenge Pending",
        scheduling: "Scheduling",
        pre_match: "Pre-Match",
        completed: "Full Time",
        disputed: "Disputed",
      }[rawStatus] ?? "Upcoming";

  const statusClass = isCompleted
    ? "bg-muted text-muted-foreground"
    : isLive
    ? "bg-destructive/15 text-destructive"
    : isPendingChallenge
    ? "bg-accent/15 text-accent"
    : isScheduling
    ? "bg-draw/15 text-draw"
    : isPreMatch
    ? "bg-win/15 text-win"
    : "bg-accent/15 text-accent";

  async function handleAccept() {
    if (!userTeamId) return;
    setLoading(true);
    setError("");
    const result = await acceptChallengeAction(match.id, userTeamId);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
  }

  async function handleDecline() {
    setLoading(true);
    setError("");
    const result = await declineChallengeAction(match.id);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.push("/matches");
  }

  async function handleSetTime() {
    if (!matchDate) return;
    setLoading(true);
    setError("");
    const result = await setMatchTimeAction({
      matchId: match.id,
      date: matchDate,
      time: matchTime,
      location: matchLocation,
    });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
  }

  async function handleSubmitResult() {
    setLoading(true);
    setError("");
    const h = parseInt(homeScore) || 0;
    const a = parseInt(awayScore) || 0;

    const goalsPayload = isTournamentOrganizer && !isParticipant
      ? {
          home: Object.fromEntries(
            homeRoster
              .map((p) => [p.player_id, formGoalsByPlayer[p.player_id] ?? 0])
              .filter(([, c]) => c > 0)
          ),
          away: Object.fromEntries(
            awayRoster
              .map((p) => [p.player_id, formGoalsByPlayer[p.player_id] ?? 0])
              .filter(([, c]) => c > 0)
          ),
        }
      : userTeamId === match.home_team_id
        ? Object.fromEntries(
            homeRoster
              .map((p) => [p.player_id, formGoalsByPlayer[p.player_id] ?? 0])
              .filter(([, c]) => c > 0)
          )
        : Object.fromEntries(
            awayRoster
              .map((p) => [p.player_id, formGoalsByPlayer[p.player_id] ?? 0])
              .filter(([, c]) => c > 0)
          );

    const result = isTournamentOrganizer && !isParticipant
      ? await organizerSubmitResultAction({
          matchId: match.id,
          homeScore: h,
          awayScore: a,
          mvpId,
          notes,
          goals: goalsPayload,
        })
      : await submitResultAction({
          matchId: match.id,
          teamId: userTeamId!,
          homeScore: h,
          awayScore: a,
          mvpId,
          notes,
          goals: goalsPayload,
        });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
    setShowResult(false);
  }

  return (
    <>
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/matches"
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
          <h1 className="text-foreground font-semibold text-lg">Match</h1>
        </div>
        <NotificationsButton />
      </header>

      <main className="flex flex-col gap-6 pb-24 pt-2">
        {/* Status */}
        <div className="flex justify-center items-center gap-2">
          {isLive && <LiveDot className="shrink-0" />}
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        {/* Scoreline */}
        <div className="px-5">
          <div className="rounded-xl bg-card border border-border shadow-card p-6">
            <div className="flex items-center gap-4">
              <TeamBlock
                teamId={match.home_team_id}
                emoji={match.home_team.emoji}
                color={match.home_team.color}
                shortName={match.home_team.short_name}
                name={match.home_team.name}
                score={match.home_score}
                isWinner={homeWin}
              />

              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-muted-foreground text-xs font-bold">VS</span>
                {isCompleted && match.home_score === match.away_score && (
                  <span className="text-draw text-xs font-bold px-2 py-0.5 bg-draw/10 rounded-full">
                    Draw
                  </span>
                )}
              </div>

              <TeamBlock
                teamId={match.away_team_id}
                emoji={match.away_team.emoji}
                color={match.away_team.color}
                shortName={match.away_team.short_name}
                name={match.away_team.name}
                score={match.away_score}
                isWinner={awayWin}
              />
            </div>
          </div>
        </div>

        {/* Match rosters (completed only) */}
        {isCompleted && homeRoster.length + awayRoster.length > 0 && (
          <MatchRostersSection
            homeRoster={homeRoster}
            awayRoster={awayRoster}
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            goalsByPlayer={goalsByPlayer}
          />
        )}

        {/* Match info */}
        <div className="px-5">
          <div className="rounded-xl bg-card border border-border shadow-card divide-y divide-border">
            {match.tournament && (
              <Link
                href={`/tournaments/${match.tournament.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors pressable"
              >
                <Trophy size={15} className="text-draw shrink-0" />
                <span className="text-foreground text-sm font-medium">{match.tournament.name}</span>
                <ChevronRight size={14} className="text-muted-foreground ml-auto shrink-0" />
              </Link>
            )}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-muted-foreground text-xs font-medium w-[15px] text-center shrink-0">⚽</span>
              <span className="text-foreground text-sm">{match.format}</span>
            </div>
            {match.date && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Calendar size={15} className="text-muted-foreground shrink-0" />
                <span className="text-foreground text-sm">
                  {format(parseISO(match.date), "EEEE, d MMMM yyyy")}
                </span>
              </div>
            )}
            {match.time && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Clock size={15} className="text-muted-foreground shrink-0" />
                <span className="text-foreground text-sm">{match.time.slice(0, 5)}</span>
              </div>
            )}
            {match.location && (
              <div className="flex items-center gap-3 px-4 py-3">
                <MapPin size={15} className="text-muted-foreground shrink-0" />
                <span className="text-foreground text-sm">{match.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5">
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-center">{error}</p>
          </div>
        )}

        {/* ─── Actions ─────────────────────────────────────────────────── */}

        {/* Accept / Decline challenge (away team only) */}
        {isPendingChallenge && isAwayTeam && (
          <div className="px-5 flex flex-col gap-3">
            <p className="text-muted-foreground text-xs text-center">
              <span className="font-semibold text-foreground">{match.home_team.name}</span> challenged you to a {match.format} match
            </p>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 pressable"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
              ) : (
                <>
                  <Check size={16} />
                  Accept Challenge
                </>
              )}
            </button>
            <button
              onClick={handleDecline}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-card border border-border text-destructive text-sm font-semibold disabled:opacity-40 hover:bg-muted/50 transition-colors pressable"
            >
              Decline
            </button>
          </div>
        )}

        {/* Scheduling: set date/time/location */}
        {isScheduling && isParticipant && (
          <div className="px-5 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-card border border-border shadow-card">
              <p className="text-foreground font-semibold text-sm mb-1">Set Match Details</p>
              <p className="text-muted-foreground text-xs">Agree on a date, time, and location with your opponent.</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Time
              </label>
              <input
                type="time"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Location
              </label>
              <input
                type="text"
                value={matchLocation}
                onChange={(e) => setMatchLocation(e.target.value)}
                placeholder="e.g. Karaiskakis Arena"
                maxLength={100}
                className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <button
              onClick={handleSetTime}
              disabled={loading || !matchDate}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
              ) : (
                "Confirm Details"
              )}
            </button>
          </div>
        )}

        {/* Pre-match: submit result (captain or tournament organizer) */}
        {isPreMatch && canSubmitResult && !showResult && (
          <div className="px-5">
            <button
              onClick={() => setShowResult(true)}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 pressable"
            >
              {isTournamentOrganizer && !isParticipant ? "Enter Result (Organizer)" : "Submit Result"}
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {isPreMatch && canSubmitResult && showResult && (
          <div className="px-5 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-card border border-border shadow-card">
              <p className="text-foreground font-semibold text-sm mb-1">Submit Result</p>
              <p className="text-muted-foreground text-xs">Enter the final score for this match.</p>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium truncate max-w-full">
                  {match.home_team.short_name}
                </span>
                <input
                  type="number"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  min={0}
                  max={99}
                  className="w-full rounded-xl bg-card border border-border px-3 py-3 text-center text-2xl font-bold text-foreground focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
              <div className="flex items-center justify-center">
                <span className="text-muted-foreground font-bold text-lg">—</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium truncate max-w-full">
                  {match.away_team.short_name}
                </span>
                <input
                  type="number"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  min={0}
                  max={99}
                  className="w-full rounded-xl bg-card border border-border px-3 py-3 text-center text-2xl font-bold text-foreground focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>

            {/* Goals per player */}
            {(homeRoster.length > 0 || awayRoster.length > 0) && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Goals per player (optional)
                </label>
                <div className="flex flex-col gap-3">
                  {isTournamentOrganizer && !isParticipant ? (
                    <>
                      <GoalsRosterSection
                        roster={homeRoster}
                        team={match.home_team}
                        goals={formGoalsByPlayer}
                        onUpdate={(playerId, delta) =>
                          setFormGoalsByPlayer((prev) => ({
                            ...prev,
                            [playerId]: Math.max(0, (prev[playerId] ?? 0) + delta),
                          }))
                        }
                      />
                      <GoalsRosterSection
                        roster={awayRoster}
                        team={match.away_team}
                        goals={formGoalsByPlayer}
                        onUpdate={(playerId, delta) =>
                          setFormGoalsByPlayer((prev) => ({
                            ...prev,
                            [playerId]: Math.max(0, (prev[playerId] ?? 0) + delta),
                          }))
                        }
                      />
                    </>
                  ) : userTeamId ? (
                    <GoalsRosterSection
                      roster={
                        userTeamId === match.home_team_id ? homeRoster : awayRoster
                      }
                      team={
                        userTeamId === match.home_team_id
                          ? match.home_team
                          : match.away_team
                      }
                      goals={formGoalsByPlayer}
                      onUpdate={(playerId, delta) =>
                        setFormGoalsByPlayer((prev) => ({
                          ...prev,
                          [playerId]: Math.max(0, (prev[playerId] ?? 0) + delta),
                        }))
                      }
                    />
                  ) : null}
                </div>
              </div>
            )}

            {/* MVP selection */}
            {teamMembers.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Man of the Match (optional)
                </label>
                <div className="flex flex-col gap-1 rounded-xl bg-card border border-border shadow-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMvpId(null)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-left transition-colors pressable ${!mvpId ? "bg-accent/10" : "hover:bg-muted/50"}`}
                  >
                    <span className="text-sm text-muted-foreground">None</span>
                  </button>
                  {teamMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMvpId(m.id)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-left border-t border-border transition-colors pressable ${mvpId === m.id ? "bg-accent/10" : "hover:bg-muted/50"}`}
                    >
                      <Avatar
                        avatar_url={m.avatar_url}
                        avatar_initials={m.avatar_initials}
                        avatar_color={m.avatar_color}
                        full_name={m.full_name}
                        size="xs"
                      />
                      <span className="text-sm text-foreground">{m.full_name}</span>
                      {mvpId === m.id && <Check size={14} className="text-accent ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="Any notes about the match..."
                className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResult(false)}
                className="flex-1 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-semibold hover:bg-muted/50 transition-colors pressable"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResult}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center pressable"
              >
                {loading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                ) : (
                  "Confirm Result"
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

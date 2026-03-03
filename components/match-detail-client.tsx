"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Calendar, Check, ChevronRight, Trophy, Minus, Plus, Pencil, X } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { format, parseISO } from "date-fns";
import { NotificationsButton } from "@/components/notifications-button";
import type { Match } from "@/lib/types";
import {
  acceptChallengeAction,
  declineChallengeAction,
  proposeMatchTimeAction,
  acceptProposalAction,
  submitResultAction,
  organizerSubmitResultAction,
  adminUpdateMatchScheduleAction,
  adminUpdateMatchResultAction,
} from "@/app/actions/matches";
import { LiveDot } from "@/components/live-dot";
import { Avatar } from "@/components/avatar";
import { TeamAvatar } from "@/components/team-avatar";
import { isTbdTeam, KNOCKOUT_STAGE_LABELS, UNKNOWN_PLAYER_ID } from "@/lib/constants";
import { PlayerSearchSelect, type PlayerSearchResult } from "@/components/player-search-select";

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

interface MatchProposal {
  id: string;
  proposed_by_team_id: string;
  proposed_date: string;
  proposed_time: string;
  location: string;
  accepted: boolean;
  team_name?: string;
}

interface MatchActionHistoryItem {
  actor_type: string;
  actor_name: string;
  score_home: number;
  score_away: number;
  created_at: string;
}

interface MatchDetailClientProps {
  match: Match;
  userTeamId: string | null;
  isCaptain?: boolean;
  proposals?: MatchProposal[];
  teamMembers: TeamMemberMin[];
  homeRoster?: RosterPlayer[];
  awayRoster?: RosterPlayer[];
  homeTeamMemberIds?: string[];
  awayTeamMemberIds?: string[];
  goalsByPlayer?: Record<string, number>;
  goalsByTeam?: { home: Record<string, number>; away: Record<string, number> };
  isTournamentOrganizer?: boolean;
  isAdmin?: boolean;
  matchActionHistory?: MatchActionHistoryItem[];
}

function TeamBlock({
  team,
  score,
  isWinner,
}: {
  team: { id: string; avatar_url?: string | null; emoji?: string; color?: string; short_name: string; name: string };
  score: number | null;
  isWinner: boolean;
}) {
  const content = (
    <>
      <TeamAvatar
        avatar_url={team.avatar_url}
        emoji={team.emoji}
        short_name={team.short_name}
        name={team.name}
        color={team.color}
        size="2xl"
      />
      <span
        className={`text-sm font-medium text-center leading-tight ${
          isWinner ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {team.name}
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
    </>
  );
  const className = "flex flex-col items-center gap-2 flex-1";
  if (isTbdTeam(team.id)) {
    return <div className={className}>{content}</div>;
  }
  return (
    <Link href={`/teams/${team.id}`} className={`${className} hover:opacity-90 transition-opacity`}>
      {content}
    </Link>
  );
}

function GoalsRosterSection({
  roster,
  guests = [],
  team,
  goals,
  onUpdate,
  onAddGuest,
  onRemoveGuest,
  showUnknown = false,
}: {
  roster: RosterPlayer[];
  guests?: RosterPlayer[];
  team: Match["home_team"];
  goals: Record<string, number>;
  onUpdate: (playerId: string, delta: number) => void;
  onAddGuest?: (player: RosterPlayer) => void;
  onRemoveGuest?: (playerId: string) => void;
  showUnknown?: boolean;
}) {
  const rosterAndGuestIds = new Set([
    ...roster.map((p) => p.player_id),
    ...guests.map((p) => p.player_id),
  ]);

  return (
    <div className="goals-roster-section rounded-xl bg-card border border-border shadow-card overflow-hidden">
      <div className="goals-roster-section__header flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
        <TeamAvatar
          avatar_url={team.avatar_url}
          emoji={team.emoji}
          short_name={team.short_name}
          name={team.name}
          color={team.color}
          size="2xs"
        />
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
        {onAddGuest && onRemoveGuest && (
          <>
            <div className="px-4 py-2 bg-muted/20 border-t border-border">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Guest players
              </span>
              <div className="mt-2">
                <PlayerSearchSelect
                  onSelect={(p: PlayerSearchResult) =>
                    onAddGuest({
                      player_id: p.id,
                      profile: {
                        full_name: p.full_name,
                        avatar_initials: p.avatar_initials,
                        avatar_color: p.avatar_color,
                        avatar_url: p.avatar_url,
                      },
                    })
                  }
                  excludeIds={rosterAndGuestIds}
                  placeholder="Add guest player..."
                />
              </div>
            </div>
            {guests.map(({ player_id, profile }) => {
              const count = goals[player_id] ?? 0;
              const name = (profile.full_name as string) ?? "Unknown";
              return (
                <div
                  key={player_id}
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted/10"
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
                    <span className="text-muted-foreground text-xs ml-1">(guest)</span>
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
                  <button
                    type="button"
                    onClick={() => onRemoveGuest(player_id)}
                    className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-destructive transition-colors pressable shrink-0"
                    aria-label={`Remove guest ${name}`}
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
          </>
        )}
        {showUnknown && (
          <div className="flex items-center gap-2 px-4 py-2.5">
            <button
              type="button"
              onClick={() => onUpdate(UNKNOWN_PLAYER_ID, -1)}
              disabled={(goals[UNKNOWN_PLAYER_ID] ?? 0) <= 0}
              className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors pressable shrink-0"
              aria-label="Remove goal from Unknown"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <Avatar
              avatar_url={null}
              avatar_initials="?"
              avatar_color="#9E9E9E"
              full_name="Unknown"
              size="2xs"
            />
            <span className="text-sm font-medium text-muted-foreground truncate flex-1 min-w-0">
              Unknown (non-registered)
            </span>
            <span className="text-sm font-bold text-draw tabular-nums w-6 text-center shrink-0">
              {goals[UNKNOWN_PLAYER_ID] ?? 0}
            </span>
            <button
              type="button"
              onClick={() => onUpdate(UNKNOWN_PLAYER_ID, 1)}
              className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors pressable shrink-0"
              aria-label="Add goal for Unknown"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
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
  goalsByTeam,
}: {
  homeRoster: RosterPlayer[];
  awayRoster: RosterPlayer[];
  homeTeam: Match["home_team"];
  awayTeam: Match["away_team"];
  goalsByPlayer: Record<string, number>;
  goalsByTeam?: { home: Record<string, number>; away: Record<string, number> };
}) {
  function RosterColumn({
    roster,
    team,
    teamGoals,
  }: {
    roster: RosterPlayer[];
    team: Match["home_team"];
    teamGoals: Record<string, number>;
  }) {
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

  // When goalsByTeam is missing, partition goalsByPlayer by roster. Unknown cannot be split
  // from the flat map, so we add it to home when present.
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
  return (
    <section className="match-rosters-section px-5">
      <h2 className="match-rosters-section__title text-foreground font-semibold text-sm mb-3">Team Rosters</h2>
      <div className="flex flex-col gap-4">
        <RosterColumn roster={homeRoster} team={homeTeam} teamGoals={homeGoals} />
        <RosterColumn roster={awayRoster} team={awayTeam} teamGoals={awayGoals} />
      </div>
    </section>
  );
}

export function MatchDetailClient({
  match,
  userTeamId,
  isCaptain = false,
  proposals = [],
  teamMembers,
  homeRoster = [],
  awayRoster = [],
  homeTeamMemberIds = [],
  awayTeamMemberIds = [],
  goalsByPlayer = {},
  goalsByTeam,
  isTournamentOrganizer = false,
  isAdmin = false,
  matchActionHistory = [],
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
  const [formGoalsByTeam, setFormGoalsByTeam] = useState<{
    home: Record<string, number>;
    away: Record<string, number>;
  }>({ home: {}, away: {} });
  const [formGuestHome, setFormGuestHome] = useState<RosterPlayer[]>([]);
  const [formGuestAway, setFormGuestAway] = useState<RosterPlayer[]>([]);

  // Admin edit state
  const [showAdminEdit, setShowAdminEdit] = useState(false);
  const [adminDate, setAdminDate] = useState(match.date ?? "");
  const [adminTime, setAdminTime] = useState(match.time?.slice(0, 5) ?? "");
  const [adminLocation, setAdminLocation] = useState(match.location ?? "");
  const [adminHomeScore, setAdminHomeScore] = useState(match.home_score?.toString() ?? "0");
  const [adminAwayScore, setAdminAwayScore] = useState(match.away_score?.toString() ?? "0");
  const [adminMvpId, setAdminMvpId] = useState<string | null>(match.mvp_id ?? null);
  const [adminNotes, setAdminNotes] = useState(match.notes ?? "");
  const [adminGuestHome, setAdminGuestHome] = useState<RosterPlayer[]>([]);
  const [adminGuestAway, setAdminGuestAway] = useState<RosterPlayer[]>([]);
  const [adminGoalsByPlayer, setAdminGoalsByPlayer] = useState<{
    home: Record<string, number>;
    away: Record<string, number>;
  }>(() => {
    const home: Record<string, number> = {};
    const away: Record<string, number> = {};
    const homeIds = new Set(homeRoster.map((p) => p.player_id));
    if (goalsByTeam) {
      for (const [pid, count] of Object.entries(goalsByTeam.home)) {
        if (count > 0) home[pid] = count;
      }
      for (const [pid, count] of Object.entries(goalsByTeam.away)) {
        if (count > 0) away[pid] = count;
      }
    } else {
      for (const [pid, count] of Object.entries(goalsByPlayer)) {
        if (count > 0) {
          if (pid === UNKNOWN_PLAYER_ID) home[pid] = count;
          else if (homeIds.has(pid)) home[pid] = count;
          else away[pid] = count;
        }
      }
    }
    return { home, away };
  });
  const [adminSaveLoading, setAdminSaveLoading] = useState(false);

  const rawStatus = match.raw_status;
  const isCompleted = rawStatus === "completed";
  const isPendingChallenge = rawStatus === "pending_challenge";
  const isScheduling = rawStatus === "scheduling";
  const isPreMatch = rawStatus === "pre_match";
  const isDisputed = rawStatus === "disputed";
  const canResolveDispute = isDisputed && (isTournamentOrganizer || isAdmin);

  const isAwayTeam = userTeamId === match.away_team_id;
  const isParticipant = userTeamId !== null;
  const canSubmitResult = (isParticipant && isCaptain) || isTournamentOrganizer;

  // Auto-sync score from goals per player (only when user has added goals)
  const isOrganizerFull = isTournamentOrganizer && !isParticipant;
  const hasFormGoals =
    Object.values(formGoalsByPlayer).some((c) => c > 0) ||
    Object.values(formGoalsByTeam.home).some((c) => c > 0) ||
    Object.values(formGoalsByTeam.away).some((c) => c > 0);
  const resolvingDispute = rawStatus === "disputed" && (isTournamentOrganizer || isAdmin);
  useEffect(() => {
    if (!showResult || !hasFormGoals) return;
    const syncBoth = isOrganizerFull || resolvingDispute;
    const syncHome = syncBoth || userTeamId === match.home_team_id;
    const syncAway = syncBoth || userTeamId === match.away_team_id;
    if (syncBoth) {
      const h =
        homeRoster.reduce((s, p) => s + (formGoalsByTeam.home[p.player_id] ?? 0), 0) +
        formGuestHome.reduce((s, p) => s + (formGoalsByTeam.home[p.player_id] ?? 0), 0) +
        (formGoalsByTeam.home[UNKNOWN_PLAYER_ID] ?? 0);
      const a =
        awayRoster.reduce((s, p) => s + (formGoalsByTeam.away[p.player_id] ?? 0), 0) +
        formGuestAway.reduce((s, p) => s + (formGoalsByTeam.away[p.player_id] ?? 0), 0) +
        (formGoalsByTeam.away[UNKNOWN_PLAYER_ID] ?? 0);
      setHomeScore(h.toString());
      setAwayScore(a.toString());
    } else if (syncHome) {
      const h =
        homeRoster.reduce((s, p) => s + (formGoalsByPlayer[p.player_id] ?? 0), 0) +
        formGuestHome.reduce((s, p) => s + (formGoalsByPlayer[p.player_id] ?? 0), 0) +
        (formGoalsByPlayer[UNKNOWN_PLAYER_ID] ?? 0);
      setHomeScore(h.toString());
    } else if (syncAway) {
      const a =
        awayRoster.reduce((s, p) => s + (formGoalsByPlayer[p.player_id] ?? 0), 0) +
        formGuestAway.reduce((s, p) => s + (formGoalsByPlayer[p.player_id] ?? 0), 0) +
        (formGoalsByPlayer[UNKNOWN_PLAYER_ID] ?? 0);
      setAwayScore(a.toString());
    }
  }, [formGoalsByPlayer, formGoalsByTeam, showResult, hasFormGoals, isOrganizerFull, resolvingDispute, userTeamId, match.home_team_id, match.away_team_id, homeRoster, awayRoster, formGuestHome, formGuestAway]);

  useEffect(() => {
    if (!showAdminEdit) return;
    const h =
      homeRoster.reduce((s, p) => s + (adminGoalsByPlayer.home[p.player_id] ?? 0), 0) +
      adminGuestHome.reduce((s, p) => s + (adminGoalsByPlayer.home[p.player_id] ?? 0), 0) +
      (adminGoalsByPlayer.home[UNKNOWN_PLAYER_ID] ?? 0);
    const a =
      awayRoster.reduce((s, p) => s + (adminGoalsByPlayer.away[p.player_id] ?? 0), 0) +
      adminGuestAway.reduce((s, p) => s + (adminGoalsByPlayer.away[p.player_id] ?? 0), 0) +
      (adminGoalsByPlayer.away[UNKNOWN_PLAYER_ID] ?? 0);
    setAdminHomeScore(h.toString());
    setAdminAwayScore(a.toString());
  }, [adminGoalsByPlayer, showAdminEdit, homeRoster, awayRoster, adminGuestHome, adminGuestAway]);
  const myTeamHasSubmitted =
    (userTeamId === match.home_team_id && match.home_result_status === "confirmed") ||
    (userTeamId === match.away_team_id && match.away_result_status === "confirmed");

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
    : isDisputed
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
    router.back();
  }

  async function handlePropose() {
    if (!userTeamId || !matchDate) return;
    setLoading(true);
    setError("");
    const result = await proposeMatchTimeAction({
      matchId: match.id,
      teamId: userTeamId,
      date: matchDate,
      time: matchTime,
      location: matchLocation.trim() || "TBD",
    });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
  }

  async function handleAcceptProposal(proposalId: string) {
    if (!userTeamId) return;
    setLoading(true);
    setError("");
    const result = await acceptProposalAction(proposalId, userTeamId, match.id);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
  }

  async function handleResolveDispute() {
    setLoading(true);
    setError("");
    const h = parseInt(homeScore) || 0;
    const a = parseInt(awayScore) || 0;
    const goalsPayload = {
      home: Object.fromEntries(
        [
          ...homeRoster.map((p) => [p.player_id, formGoalsByTeam.home[p.player_id] ?? 0] as const),
          ...formGuestHome.map((p) => [p.player_id, formGoalsByTeam.home[p.player_id] ?? 0] as const),
          [UNKNOWN_PLAYER_ID, formGoalsByTeam.home[UNKNOWN_PLAYER_ID] ?? 0] as const,
        ].filter(([, c]) => Number(c) > 0)
      ),
      away: Object.fromEntries(
        [
          ...awayRoster.map((p) => [p.player_id, formGoalsByTeam.away[p.player_id] ?? 0] as const),
          ...formGuestAway.map((p) => [p.player_id, formGoalsByTeam.away[p.player_id] ?? 0] as const),
          [UNKNOWN_PLAYER_ID, formGoalsByTeam.away[UNKNOWN_PLAYER_ID] ?? 0] as const,
        ].filter(([, c]) => Number(c) > 0)
      ),
    };
    const guestPayload = {
      home: formGuestHome.map((p) => p.player_id),
      away: formGuestAway.map((p) => p.player_id),
    };
    const result =
      isAdmin
        ? await adminUpdateMatchResultAction({
            matchId: match.id,
            homeScore: h,
            awayScore: a,
            mvpId,
            notes,
            goals: goalsPayload,
            guestPlayerIds: guestPayload,
          })
        : await organizerSubmitResultAction({
            matchId: match.id,
            homeScore: h,
            awayScore: a,
            mvpId,
            notes,
            goals: goalsPayload,
            guestPlayerIds: guestPayload,
          });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowResult(false);
    router.refresh();
  }

  async function handleSubmitResult() {
    setLoading(true);
    setError("");
    const h = parseInt(homeScore) || 0;
    const a = parseInt(awayScore) || 0;

    const guestPayload =
      userTeamId === match.home_team_id
        ? formGuestHome.map((p) => p.player_id)
        : formGuestAway.map((p) => p.player_id);

    const result = isTournamentOrganizer && !isParticipant
      ? await organizerSubmitResultAction({
          matchId: match.id,
          homeScore: h,
          awayScore: a,
          mvpId,
          notes,
          goals: {
            home: Object.fromEntries(
              [
                ...homeRoster.map((p) => [p.player_id, formGoalsByTeam.home[p.player_id] ?? 0] as const),
                ...formGuestHome.map((p) => [p.player_id, formGoalsByTeam.home[p.player_id] ?? 0] as const),
                [UNKNOWN_PLAYER_ID, formGoalsByTeam.home[UNKNOWN_PLAYER_ID] ?? 0] as const,
              ].filter(([, c]) => Number(c) > 0)
            ),
            away: Object.fromEntries(
              [
                ...awayRoster.map((p) => [p.player_id, formGoalsByTeam.away[p.player_id] ?? 0] as const),
                ...formGuestAway.map((p) => [p.player_id, formGoalsByTeam.away[p.player_id] ?? 0] as const),
                [UNKNOWN_PLAYER_ID, formGoalsByTeam.away[UNKNOWN_PLAYER_ID] ?? 0] as const,
              ].filter(([, c]) => Number(c) > 0)
            ),
          },
          guestPlayerIds: {
            home: formGuestHome.map((p) => p.player_id),
            away: formGuestAway.map((p) => p.player_id),
          },
        })
      : await submitResultAction({
          matchId: match.id,
          teamId: userTeamId!,
          homeScore: h,
          awayScore: a,
          mvpId,
          notes,
          goals: Object.fromEntries(
            [
              ...(userTeamId === match.home_team_id ? homeRoster : awayRoster).map((p) => [
                p.player_id,
                formGoalsByPlayer[p.player_id] ?? 0,
              ] as const),
              ...(userTeamId === match.home_team_id ? formGuestHome : formGuestAway).map((p) => [
                p.player_id,
                formGoalsByPlayer[p.player_id] ?? 0,
              ] as const),
              [UNKNOWN_PLAYER_ID, formGoalsByPlayer[UNKNOWN_PLAYER_ID] ?? 0] as const,
            ].filter(([, c]) => Number(c) > 0)
          ),
          guestPlayerIds: guestPayload,
        });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
    setShowResult(false);
  }

  async function handleAdminSave() {
    setAdminSaveLoading(true);
    setError("");
    const scheduleResult = await adminUpdateMatchScheduleAction({
      matchId: match.id,
      date: adminDate,
      time: adminTime,
      location: adminLocation,
    });
    if (scheduleResult.error) {
      setError(scheduleResult.error);
      setAdminSaveLoading(false);
      return;
    }
    const h = parseInt(adminHomeScore) || 0;
    const a = parseInt(adminAwayScore) || 0;
    const goalsPayload = {
      home: Object.fromEntries(
        [
          ...homeRoster.map((p) => [p.player_id, adminGoalsByPlayer.home[p.player_id] ?? 0] as const),
          ...adminGuestHome.map((p) => [p.player_id, adminGoalsByPlayer.home[p.player_id] ?? 0] as const),
          [UNKNOWN_PLAYER_ID, adminGoalsByPlayer.home[UNKNOWN_PLAYER_ID] ?? 0] as const,
        ].filter(([, c]) => Number(c) > 0)
      ),
      away: Object.fromEntries(
        [
          ...awayRoster.map((p) => [p.player_id, adminGoalsByPlayer.away[p.player_id] ?? 0] as const),
          ...adminGuestAway.map((p) => [p.player_id, adminGoalsByPlayer.away[p.player_id] ?? 0] as const),
          [UNKNOWN_PLAYER_ID, adminGoalsByPlayer.away[UNKNOWN_PLAYER_ID] ?? 0] as const,
        ].filter(([, c]) => Number(c) > 0)
      ),
    };
    const homeSum = Object.values(goalsPayload.home).reduce((s, c) => s + Number(c), 0);
    const awaySum = Object.values(goalsPayload.away).reduce((s, c) => s + Number(c), 0);
    if (homeSum !== h || awaySum !== a) {
      setError(`Goals must match the score. Home: ${homeSum} ≠ ${h}, Away: ${awaySum} ≠ ${a}`);
      setAdminSaveLoading(false);
      return;
    }
    const homeTeamMemberSet = new Set(homeTeamMemberIds);
    const awayTeamMemberSet = new Set(awayTeamMemberIds);
    const guestPayload = {
      home: [
        ...adminGuestHome.map((p) => p.player_id),
        ...homeRoster.filter((p) => !homeTeamMemberSet.has(p.player_id)).map((p) => p.player_id),
      ].filter((id, i, arr) => arr.indexOf(id) === i),
      away: [
        ...adminGuestAway.map((p) => p.player_id),
        ...awayRoster.filter((p) => !awayTeamMemberSet.has(p.player_id)).map((p) => p.player_id),
      ].filter((id, i, arr) => arr.indexOf(id) === i),
    };
    const res = await adminUpdateMatchResultAction({
      matchId: match.id,
      homeScore: h,
      awayScore: a,
      mvpId: adminMvpId,
      notes: adminNotes,
      goals: goalsPayload,
      guestPlayerIds: guestPayload,
    });
    setAdminSaveLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
    setShowAdminEdit(false);
  }

  return (
    <>
      <header className="match-detail-header px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-foreground font-semibold text-lg">Match</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAdminEdit(true)}
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
              aria-label="Edit match"
            >
              <Pencil size={18} className="text-muted-foreground" />
            </button>
          )}
          <NotificationsButton />
        </div>
      </header>

      <main className="match-detail__main flex flex-col gap-6 pb-24 pt-2">
        {/* Status */}
        <div className="match-detail__status flex justify-center items-center gap-2">
          {isLive && <LiveDot className="shrink-0" />}
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        {/* Scoreline */}
        <div className="match-detail__scoreline-wrapper px-5">
          <div className="match-detail__scoreline rounded-xl bg-card border border-border shadow-card p-6">
            <div className="flex items-center gap-4">
              <TeamBlock
                team={match.home_team}
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
                team={match.away_team}
                score={match.away_score}
                isWinner={awayWin}
              />
            </div>
          </div>
        </div>

        {/* Match rosters (completed only) */}
        {isCompleted && (homeRoster.length + awayRoster.length > 0 || (goalsByTeam?.home?.[UNKNOWN_PLAYER_ID] ?? 0) + (goalsByTeam?.away?.[UNKNOWN_PLAYER_ID] ?? 0) > 0) && (
          <MatchRostersSection
            homeRoster={homeRoster}
            awayRoster={awayRoster}
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            goalsByPlayer={goalsByPlayer}
            goalsByTeam={goalsByTeam}
          />
        )}

        {/* Match info */}
        <div className="match-detail__info-wrapper px-5">
          <div className="match-detail__info rounded-xl bg-card border border-border shadow-card divide-y divide-border">
            {match.tournament && (
              <Link
                href={`/tournaments/${match.tournament.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors pressable"
              >
                <Trophy size={15} className="text-draw shrink-0" />
                <span className="text-foreground text-sm font-medium">
                  {match.tournament.name}
                  {match.tournament.stage && (
                    <span className="text-muted-foreground font-normal">
                      {" · "}
                      {KNOCKOUT_STAGE_LABELS[match.tournament.stage] ?? match.tournament.stage}
                    </span>
                  )}
                </span>
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

        {/* Action history */}
        {matchActionHistory.length > 0 && (
          <div className="px-5">
            <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions history</p>
              </div>
              <div className="divide-y divide-border">
                {matchActionHistory.map((item, idx) => {
                  const roleLabel =
                    item.actor_type === "captain"
                      ? "Captain"
                      : item.actor_type === "admin"
                        ? "Admin"
                        : "Organiser";
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="text-sm text-foreground">
                        <span className="font-medium">{roleLabel} {item.actor_name}</span>
                        <span className="text-muted-foreground"> submitted score </span>
                        <span className="font-semibold">&apos;{item.score_home}-{item.score_away}&apos;</span>
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(parseISO(item.created_at), "d MMM, HH:mm")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-5">
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-center">{error}</p>
          </div>
        )}

        {/* ─── Actions ─────────────────────────────────────────────────── */}

        {/* Accept / Decline challenge (Team 2 only) */}
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

        {/* Scheduling: captains propose date/time; opponent accepts */}
        {isScheduling && isParticipant && (
          <div className="px-5 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-card border border-border shadow-card">
              <p className="text-foreground font-semibold text-sm mb-1">Propose Match Details</p>
              <p className="text-muted-foreground text-xs">
                Each captain can propose a date, time, and location. The opponent must accept a proposal for it to become final.
              </p>
            </div>

            {/* Proposals from both teams */}
            {proposals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proposals</p>
                {proposals.map((p) => {
                  const isFromOpponent = p.proposed_by_team_id !== userTeamId;
                  const canAccept = isCaptain && isFromOpponent;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {p.team_name ?? "Team"} · {format(parseISO(p.proposed_date), "EEE d MMM")}
                          {p.proposed_time && ` @ ${p.proposed_time}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{p.location}</p>
                      </div>
                      {canAccept && (
                        <button
                          onClick={() => handleAcceptProposal(p.id)}
                          disabled={loading}
                          className="shrink-0 py-2 px-3 rounded-lg bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity pressable"
                        >
                          {loading ? (
                            <span className="h-3 w-3 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin inline-block" />
                          ) : (
                            <>
                              <Check size={12} className="inline mr-1 -mt-0.5" />
                              Accept
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Propose form (captains only) */}
            {isCaptain && (
              <>
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
                  onClick={handlePropose}
                  disabled={loading || !matchDate}
                  className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  {loading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                  ) : (
                    "Propose Date & Time"
                  )}
                </button>
              </>
            )}

            {isScheduling && isParticipant && !isCaptain && proposals.length === 0 && (
              <p className="text-muted-foreground text-xs text-center py-2">
                Waiting for your captain to propose a date and time.
              </p>
            )}
          </div>
        )}

        {/* Pre-match: submit result (captain or tournament organizer) */}
        {isPreMatch && canSubmitResult && myTeamHasSubmitted && !showResult && (
          <div className="px-5">
            <div className="py-3.5 rounded-xl bg-muted/50 border border-border text-center">
              <p className="text-sm font-medium text-foreground">Result submitted</p>
              <p className="text-xs text-muted-foreground mt-0.5">Awaiting opponent confirmation</p>
            </div>
          </div>
        )}

        {isPreMatch && canSubmitResult && !myTeamHasSubmitted && !showResult && (
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

        {isPreMatch && canSubmitResult && !myTeamHasSubmitted && showResult && (
          <div className="px-5 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-card border border-border shadow-card">
              <p className="text-foreground font-semibold text-sm mb-1">Submit Result</p>
              <p className="text-muted-foreground text-xs">
                Add goals per player — unassigned goals go to Unknown. Add guest players below to assign goals to them.
              </p>
            </div>

            {/* Goals per player — always show so user can add guests and assign goals */}
            <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Goals per player (optional)
                </label>
                <div className="flex flex-col gap-3">
                  {isTournamentOrganizer && !isParticipant ? (
                    <>
                      <GoalsRosterSection
                        roster={homeRoster}
                        guests={formGuestHome}
                        team={match.home_team}
                        goals={formGoalsByTeam.home}
                        onUpdate={(playerId, delta) =>
                          setFormGoalsByTeam((prev) => ({
                            ...prev,
                            home: {
                              ...prev.home,
                              [playerId]: Math.max(0, (prev.home[playerId] ?? 0) + delta),
                            },
                          }))
                        }
                        onAddGuest={(p) => setFormGuestHome((prev) => (prev.some((g) => g.player_id === p.player_id) ? prev : [...prev, p]))}
                        onRemoveGuest={(id) => setFormGuestHome((prev) => prev.filter((g) => g.player_id !== id))}
                        showUnknown
                      />
                      <GoalsRosterSection
                        roster={awayRoster}
                        guests={formGuestAway}
                        team={match.away_team}
                        goals={formGoalsByTeam.away}
                        onUpdate={(playerId, delta) =>
                          setFormGoalsByTeam((prev) => ({
                            ...prev,
                            away: {
                              ...prev.away,
                              [playerId]: Math.max(0, (prev.away[playerId] ?? 0) + delta),
                            },
                          }))
                        }
                        onAddGuest={(p) => setFormGuestAway((prev) => (prev.some((g) => g.player_id === p.player_id) ? prev : [...prev, p]))}
                        onRemoveGuest={(id) => setFormGuestAway((prev) => prev.filter((g) => g.player_id !== id))}
                        showUnknown
                      />
                    </>
                  ) : userTeamId ? (
                    <GoalsRosterSection
                      roster={
                        userTeamId === match.home_team_id ? homeRoster : awayRoster
                      }
                      guests={
                        userTeamId === match.home_team_id ? formGuestHome : formGuestAway
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
                      onAddGuest={(p) =>
                        userTeamId === match.home_team_id
                          ? setFormGuestHome((prev) => (prev.some((g) => g.player_id === p.player_id) ? prev : [...prev, p]))
                          : setFormGuestAway((prev) => (prev.some((g) => g.player_id === p.player_id) ? prev : [...prev, p]))
                      }
                      onRemoveGuest={(id) =>
                        userTeamId === match.home_team_id
                          ? setFormGuestHome((prev) => prev.filter((g) => g.player_id !== id))
                          : setFormGuestAway((prev) => prev.filter((g) => g.player_id !== id))
                      }
                      showUnknown
                    />
                  ) : null}
                </div>
            </div>

            {/* Score — compact display when goals exist, full inputs otherwise */}
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
            <p className="text-xs text-muted-foreground text-center -mt-2">
              Score updates automatically when you add goals above. You can also edit manually.
            </p>

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

        {/* Disputed: organizer or admin can resolve by entering final score */}
        {canResolveDispute && !showResult && (
          <div className="px-5">
            <div className={`p-4 rounded-xl border ${isAdmin ? "bg-card border-border" : "bg-destructive/10 border-destructive/20"}`}>
              {isAdmin ? (
                <>
                  <p className="text-foreground font-semibold text-sm">Enter match result</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Enter the correct final score to complete this match.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-foreground font-semibold text-sm">Captains submitted different scores</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Enter the correct final score to resolve this dispute.
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => setShowResult(true)}
              className="w-full mt-3 py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 pressable"
            >
              {isAdmin ? "Enter Result" : "Resolve Dispute"}
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {canResolveDispute && showResult && (
          <div className="px-5 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-card border border-border shadow-card">
              <p className="text-foreground font-semibold text-sm mb-1">{isAdmin ? "Enter Result" : "Resolve Dispute"}</p>
              <p className="text-muted-foreground text-xs">
                Add goals per player — unassigned goals go to Unknown. Add guest players below to assign goals to them.
              </p>
            </div>

            {/* Goals per player — always show so user can add guests and assign goals */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                Goals per player
              </label>
              <div className="flex flex-col gap-3">
                <GoalsRosterSection
                  roster={homeRoster}
                  guests={formGuestHome}
                  team={match.home_team}
                  goals={formGoalsByTeam.home}
                  onUpdate={(playerId, delta) =>
                    setFormGoalsByTeam((prev) => ({
                      ...prev,
                      home: {
                        ...prev.home,
                        [playerId]: Math.max(0, (prev.home[playerId] ?? 0) + delta),
                      },
                    }))
                  }
                  onAddGuest={(p) => setFormGuestHome((prev) => (prev.some((g) => g.player_id === p.player_id) ? prev : [...prev, p]))}
                  onRemoveGuest={(id) => setFormGuestHome((prev) => prev.filter((g) => g.player_id !== id))}
                  showUnknown
                />
                <GoalsRosterSection
                  roster={awayRoster}
                  guests={formGuestAway}
                  team={match.away_team}
                  goals={formGoalsByTeam.away}
                  onUpdate={(playerId, delta) =>
                    setFormGoalsByTeam((prev) => ({
                      ...prev,
                      away: {
                        ...prev.away,
                        [playerId]: Math.max(0, (prev.away[playerId] ?? 0) + delta),
                      },
                    }))
                  }
                  onAddGuest={(p) => setFormGuestAway((prev) => (prev.some((g) => g.player_id === p.player_id) ? prev : [...prev, p]))}
                  onRemoveGuest={(id) => setFormGuestAway((prev) => prev.filter((g) => g.player_id !== id))}
                  showUnknown
                />
              </div>
            </div>

            {/* Score */}
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
            <p className="text-xs text-muted-foreground text-center -mt-2">
              Score updates automatically when you add goals above. You can also edit manually.
            </p>

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
                onClick={handleResolveDispute}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center pressable"
              >
                {loading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                ) : (
                  isAdmin ? "Confirm Result" : "Confirm Resolution"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Admin: Edit match — full-screen drawer */}
        {isAdmin && showAdminEdit && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <h2 className="text-base font-semibold text-foreground">Edit match</h2>
                <button
                  onClick={() => setShowAdminEdit(false)}
                  className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors pressable"
                  aria-label="Close"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                {/* Schedule */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Schedule
                  </p>
                  <div className="grid gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                      <input
                        type="date"
                        value={adminDate}
                        onChange={(e) => setAdminDate(e.target.value)}
                        className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Time</label>
                      <input
                        type="time"
                        value={adminTime}
                        onChange={(e) => setAdminTime(e.target.value)}
                        className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                      <input
                        type="text"
                        value={adminLocation}
                        onChange={(e) => setAdminLocation(e.target.value)}
                        placeholder="e.g. Karaiskakis Arena"
                        className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Result */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Result
                  </p>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Goals per player (unassigned go to Unknown; add guests to assign)</label>
                    <div className="flex flex-col gap-3">
                      <GoalsRosterSection
                        roster={homeRoster}
                        guests={adminGuestHome}
                        team={match.home_team}
                        goals={adminGoalsByPlayer.home}
                        onUpdate={(playerId, delta) =>
                          setAdminGoalsByPlayer((prev) => ({
                            ...prev,
                            home: {
                              ...prev.home,
                              [playerId]: Math.max(0, (prev.home[playerId] ?? 0) + delta),
                            },
                          }))
                        }
                        onAddGuest={(p) => setAdminGuestHome((prev) => (prev.some((g) => g.player_id === p.player_id) ? prev : [...prev, p]))}
                        onRemoveGuest={(id) => setAdminGuestHome((prev) => prev.filter((g) => g.player_id !== id))}
                        showUnknown
                      />
                      <GoalsRosterSection
                        roster={awayRoster}
                        guests={adminGuestAway}
                        team={match.away_team}
                        goals={adminGoalsByPlayer.away}
                        onUpdate={(playerId, delta) =>
                          setAdminGoalsByPlayer((prev) => ({
                            ...prev,
                            away: {
                              ...prev.away,
                              [playerId]: Math.max(0, (prev.away[playerId] ?? 0) + delta),
                            },
                          }))
                        }
                        onAddGuest={(p) => setAdminGuestAway((prev) => (prev.some((g) => g.player_id === p.player_id) ? prev : [...prev, p]))}
                        onRemoveGuest={(id) => setAdminGuestAway((prev) => prev.filter((g) => g.player_id !== id))}
                        showUnknown
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Score updates automatically from goals above.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">{match.home_team.short_name}</span>
                      <input
                        type="number"
                        value={adminHomeScore}
                        onChange={(e) => setAdminHomeScore(e.target.value)}
                        min={0}
                        max={99}
                        className="w-full rounded-xl bg-card border border-border px-3 py-3 text-center text-xl font-bold text-foreground focus:outline-none focus:border-accent/50"
                      />
                    </div>
                    <div className="text-center text-muted-foreground font-bold">—</div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">{match.away_team.short_name}</span>
                      <input
                        type="number"
                        value={adminAwayScore}
                        onChange={(e) => setAdminAwayScore(e.target.value)}
                        min={0}
                        max={99}
                        className="w-full rounded-xl bg-card border border-border px-3 py-3 text-center text-xl font-bold text-foreground focus:outline-none focus:border-accent/50"
                      />
                    </div>
                  </div>

                  {teamMembers.length > 0 && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Man of the Match</label>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setAdminMvpId(null)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            !adminMvpId ? "bg-accent/20 text-accent" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          None
                        </button>
                        {teamMembers.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setAdminMvpId(m.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              adminMvpId === m.id ? "bg-accent/20 text-accent" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {m.full_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-center">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAdminEdit(false)}
                      className="flex-1 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-semibold hover:bg-muted/50 transition-colors pressable"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdminSave}
                      disabled={adminSaveLoading}
                      className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 pressable"
                    >
                      {adminSaveLoading ? (
                        <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

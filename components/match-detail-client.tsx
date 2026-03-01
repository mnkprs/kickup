"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Calendar, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Match } from "@/lib/types";
import {
  acceptChallengeAction,
  declineChallengeAction,
  setMatchTimeAction,
  submitResultAction,
} from "@/app/actions/matches";

interface TeamMemberMin {
  id: string;
  full_name: string;
  avatar_initials: string;
  avatar_color: string;
}

interface MatchDetailClientProps {
  match: Match;
  userTeamId: string | null;
  teamMembers: TeamMemberMin[];
}

function TeamBlock({
  emoji,
  color,
  shortName,
  name,
  score,
  isWinner,
}: {
  emoji?: string;
  color?: string;
  shortName: string;
  name: string;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
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
    </div>
  );
}

export function MatchDetailClient({
  match,
  userTeamId,
  teamMembers,
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

  const rawStatus = match.raw_status;
  const isCompleted = rawStatus === "completed";
  const isPendingChallenge = rawStatus === "pending_challenge";
  const isScheduling = rawStatus === "scheduling";
  const isPreMatch = rawStatus === "pre_match";

  const isAwayTeam = userTeamId === match.away_team_id;
  const isParticipant = userTeamId !== null;

  const homeWin = isCompleted && match.home_score! > match.away_score!;
  const awayWin = isCompleted && match.away_score! > match.home_score!;

  const statusLabel = {
    pending_challenge: "Challenge Pending",
    scheduling: "Scheduling",
    pre_match: "Pre-Match",
    completed: "Full Time",
    disputed: "Disputed",
  }[rawStatus] ?? "Upcoming";

  const statusClass = isCompleted
    ? "bg-muted text-muted-foreground"
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
    if (!userTeamId) return;
    setLoading(true);
    setError("");
    const result = await submitResultAction({
      matchId: match.id,
      teamId: userTeamId,
      homeScore: parseInt(homeScore) || 0,
      awayScore: parseInt(awayScore) || 0,
      mvpId,
      notes,
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
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
          <h1 className="text-foreground font-semibold text-lg">Match</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-col gap-6 pb-24 pt-2">
        {/* Status */}
        <div className="flex justify-center">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        {/* Scoreline */}
        <div className="px-5">
          <div className="rounded-xl bg-card border border-border p-6">
            <div className="flex items-center gap-4">
              <TeamBlock
                emoji={match.home_team.emoji}
                color={match.home_team.color}
                shortName={match.home_team.short_name}
                name={match.home_team.name}
                score={match.home_score}
                isWinner={homeWin}
              />

              <div className="flex flex-col items-center gap-1 shrink-0">
                {!isCompleted && (
                  <span className="text-muted-foreground text-xs font-bold">VS</span>
                )}
                {isCompleted && match.home_score === match.away_score && (
                  <span className="text-draw text-xs font-bold px-2 py-0.5 bg-draw/10 rounded-full">
                    Draw
                  </span>
                )}
              </div>

              <TeamBlock
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

        {/* Match info */}
        <div className="px-5">
          <div className="rounded-xl bg-card border border-border divide-y divide-border">
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
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
              className="w-full py-3 rounded-xl bg-card border border-border text-destructive text-sm font-semibold disabled:opacity-40 hover:bg-muted/50 transition-colors"
            >
              Decline
            </button>
          </div>
        )}

        {/* Scheduling: set date/time/location */}
        {isScheduling && isParticipant && (
          <div className="px-5 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-card border border-border">
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

        {/* Pre-match: submit result */}
        {isPreMatch && isParticipant && !showResult && (
          <div className="px-5">
            <button
              onClick={() => setShowResult(true)}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Submit Result
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {isPreMatch && isParticipant && showResult && (
          <div className="px-5 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-card border border-border">
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

            {/* MVP selection */}
            {teamMembers.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Man of the Match (optional)
                </label>
                <div className="flex flex-col gap-1 rounded-xl bg-card border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMvpId(null)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${!mvpId ? "bg-accent/10" : "hover:bg-muted/50"}`}
                  >
                    <span className="text-sm text-muted-foreground">None</span>
                  </button>
                  {teamMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMvpId(m.id)}
                      className={`flex items-center gap-3 px-4 py-2.5 text-left border-t border-border transition-colors ${mvpId === m.id ? "bg-accent/10" : "hover:bg-muted/50"}`}
                    >
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                        style={{ backgroundColor: m.avatar_color }}
                      >
                        {m.avatar_initials}
                      </div>
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
                className="flex-1 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-semibold hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResult}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center"
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

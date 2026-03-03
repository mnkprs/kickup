"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, ChevronRight, Trophy, Loader2 } from "lucide-react";
import {
  startGroupStageAction,
  advanceToKnockoutsAction,
  advanceToFinalAction,
  completeTournamentAction,
} from "@/app/actions/tournaments";
import type { TournamentMatchWithStage } from "@/lib/db/tournaments";

interface TournamentOrganizerControlsProps {
  tournamentId: string;
  rawStatus: string;
  teamsCount: number;
  /** Knockout matches (semi_final + final) for advance-to-final logic */
  knockoutMatches?: TournamentMatchWithStage[];
}

export function TournamentOrganizerControls({
  tournamentId,
  rawStatus,
  teamsCount,
  knockoutMatches = [],
}: TournamentOrganizerControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const semiFinals = knockoutMatches.filter((m) => m.stage === "semi_final");
  const finalMatch = knockoutMatches.find((m) => m.stage === "final");
  const allSemisCompleted =
    semiFinals.length >= 2 &&
    semiFinals.every((m) => m.status === "completed" || m.raw_status === "completed");
  const canAdvanceToFinal = !finalMatch && allSemisCompleted;
  const finalCompleted =
    !!finalMatch && (finalMatch.status === "completed" || finalMatch.raw_status === "completed");

  async function handleStartGroupStage() {
    setLoading("start");
    setError(null);
    const result = await startGroupStageAction(tournamentId);
    setLoading(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleAdvanceToKnockouts() {
    setLoading("advance");
    setError(null);
    const result = await advanceToKnockoutsAction(tournamentId);
    setLoading(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleAdvanceToFinal() {
    setLoading("final");
    setError(null);
    const result = await advanceToFinalAction(tournamentId);
    setLoading(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleComplete() {
    setLoading("complete");
    setError(null);
    const result = await completeTournamentAction(tournamentId);
    setLoading(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (rawStatus === "registration") {
    const canStart = teamsCount >= 2;
    return (
      <section className="px-5">
        <div className="rounded-xl bg-card border border-border shadow-card p-4">
          <p className="text-muted-foreground text-sm mb-3">
            {canStart
              ? "Ready to start. This will create groups and schedule matches."
              : `Need at least 2 approved teams to start (${teamsCount}/${2}).`}
          </p>
          <button
            onClick={handleStartGroupStage}
            disabled={!canStart || loading !== null}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-win text-win-foreground font-medium hover:bg-win/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === "start" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Play size={18} />
                Start tournament
              </>
            )}
          </button>
          {error && (
            <p className="text-destructive text-sm mt-2">{error}</p>
          )}
        </div>
      </section>
    );
  }

  if (rawStatus === "group_stage") {
    return (
      <section className="px-5">
        <div className="rounded-xl bg-card border border-border shadow-card p-4">
          <p className="text-muted-foreground text-sm mb-3">
            All group matches completed? Advance to semi-finals.
          </p>
          <button
            onClick={handleAdvanceToKnockouts}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === "advance" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <ChevronRight size={18} />
                Advance to knockouts
              </>
            )}
          </button>
          {error && (
            <p className="text-destructive text-sm mt-2">{error}</p>
          )}
        </div>
      </section>
    );
  }

  if (rawStatus === "knockout_stage") {
    if (canAdvanceToFinal) {
      return (
        <section className="px-5">
          <div className="rounded-xl bg-card border border-border shadow-card p-4">
            <p className="text-muted-foreground text-sm mb-3">
              Both semi-finals completed? Create the final match.
            </p>
            <button
              onClick={handleAdvanceToFinal}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === "final" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <ChevronRight size={18} />
                  Advance to final
                </>
              )}
            </button>
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
          </div>
        </section>
      );
    }

    if (finalCompleted) {
      return (
        <section className="px-5">
          <div className="rounded-xl bg-card border border-border shadow-card p-4">
            <p className="text-muted-foreground text-sm mb-3">
              Final completed? Mark the tournament as finished.
            </p>
            <button
              onClick={handleComplete}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-draw text-foreground font-medium hover:bg-draw/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading === "complete" ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Trophy size={18} />
                  Complete tournament
                </>
              )}
            </button>
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
          </div>
        </section>
      );
    }

    return null;
  }

  return null;
}

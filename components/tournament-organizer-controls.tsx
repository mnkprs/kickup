"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, ChevronRight, Trophy, Loader2, Plus } from "lucide-react";
import {
  startGroupStageAction,
  advanceToKnockoutsAction,
  advanceToFinalAction,
  completeTournamentAction,
} from "@/app/actions/tournaments";
import type { TournamentMatchWithStage } from "@/lib/db/tournaments";
import { CreateKnockoutMatchForm } from "@/components/create-knockout-match-form";

const KNOCKOUT_STAGES = ["round_of_16", "quarter_final", "semi_final", "final"] as const;

function getNextRoundLabel(matchCount: number): string {
  if (matchCount === 2) return "Final";
  if (matchCount === 4) return "Semi-finals";
  if (matchCount === 8) return "Quarter-finals";
  return "Next round";
}

interface TournamentOrganizerControlsProps {
  tournamentId: string;
  rawStatus: string;
  teamsCount: number;
  knockoutMode?: "auto" | "custom";
  /** Knockout matches (all rounds) for advance logic */
  knockoutMatches?: TournamentMatchWithStage[];
  advancingTeams?: { id: string; name: string; short_name: string }[];
}

export function TournamentOrganizerControls({
  tournamentId,
  rawStatus,
  teamsCount,
  knockoutMode = "auto",
  knockoutMatches = [],
  advancingTeams = [],
}: TournamentOrganizerControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateMatch, setShowCreateMatch] = useState(false);

  const knockoutOnly = knockoutMatches.filter((m) =>
    KNOCKOUT_STAGES.includes(m.stage as (typeof KNOCKOUT_STAGES)[number])
  );
  const finalMatch = knockoutOnly.find((m) => m.stage === "final");
  const maxRoundOrder = Math.max(0, ...knockoutOnly.map((m) => m.round_order ?? 0));
  const currentRoundMatches = knockoutOnly.filter((m) => (m.round_order ?? 0) === maxRoundOrder);
  const allCurrentRoundCompleted =
    currentRoundMatches.length >= 2 &&
    currentRoundMatches.every((m) => m.status === "completed" || m.raw_status === "completed");
  const canAdvanceToNextRound = !finalMatch && allCurrentRoundCompleted;
  const nextRoundLabel = getNextRoundLabel(currentRoundMatches.length);
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
            {knockoutMode === "custom"
              ? "All group matches completed? Advance to knockouts and create matches manually."
              : "All group matches completed? Advance to knockouts."}
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
    if (canAdvanceToNextRound) {
      return (
        <section className="px-5">
          <div className="rounded-xl bg-card border border-border shadow-card p-4">
            <p className="text-muted-foreground text-sm mb-3">
              All matches in current round completed? Advance to {nextRoundLabel.toLowerCase()}.
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
                  Advance to {nextRoundLabel}
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

    if (knockoutMode === "custom" && !canAdvanceToNextRound && !finalCompleted) {
      return (
        <section className="px-5">
          <div className="rounded-xl bg-card border border-border shadow-card p-4">
            {showCreateMatch ? (
              <CreateKnockoutMatchForm
                tournamentId={tournamentId}
                advancingTeams={advancingTeams}
                onClose={() => setShowCreateMatch(false)}
                onSuccess={() => {
                  setShowCreateMatch(false);
                  router.refresh();
                }}
              />
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-3">
                  Create knockout matches and assign teams from the advancing teams.
                </p>
                <button
                  onClick={() => setShowCreateMatch(true)}
                  disabled={loading !== null}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={18} />
                  Create knockout match
                </button>
              </>
            )}
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { createKnockoutMatchAction } from "@/app/actions/tournaments";
import type { TournamentMatchWithStage } from "@/lib/db/tournaments";
import { isTbdTeam } from "@/lib/constants";

const STAGE_OPTIONS: { value: "round_of_16" | "quarter_final" | "semi_final" | "final"; label: string }[] = [
  { value: "round_of_16", label: "Round of 16" },
  { value: "quarter_final", label: "Quarter-final" },
  { value: "semi_final", label: "Semi-final" },
  { value: "final", label: "Final" },
];

const STAGE_ORDER: Record<string, number> = {
  round_of_16: 1,
  quarter_final: 2,
  semi_final: 3,
  final: 4,
};

const PREV_STAGE: Record<string, string | null> = {
  round_of_16: null,
  quarter_final: "round_of_16",
  semi_final: "quarter_final",
  final: "semi_final",
};

function stageToRoundOrder(stage: string): number {
  return STAGE_ORDER[stage] ?? 1;
}

function getWinner(m: TournamentMatchWithStage): string | null {
  if (m.home_score == null || m.away_score == null || m.status !== "completed") return null;
  if (isTbdTeam(m.home_team_id) || isTbdTeam(m.away_team_id)) return null;
  if (m.home_score > m.away_score) return m.home_team_id;
  if (m.away_score > m.home_score) return m.away_team_id;
  return null;
}

interface CreateKnockoutMatchFormProps {
  tournamentId: string;
  advancingTeams: { id: string; name: string; short_name: string }[];
  knockoutMatches?: TournamentMatchWithStage[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateKnockoutMatchForm({
  tournamentId,
  advancingTeams,
  knockoutMatches = [],
  onClose,
  onSuccess,
}: CreateKnockoutMatchFormProps) {
  const [stage, setStage] = useState<"round_of_16" | "quarter_final" | "semi_final" | "final">("quarter_final");
  const [homeTeamId, setHomeTeamId] = useState<string>("");
  const [awayTeamId, setAwayTeamId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPhase = useMemo(() => {
    const knockoutOnly = knockoutMatches.filter(
      (m) => m.stage && ["round_of_16", "quarter_final", "semi_final", "final"].includes(m.stage)
    );
    if (knockoutOnly.length === 0) return 1;
    const orders = knockoutOnly.map((m) => STAGE_ORDER[m.stage!] ?? m.round_order ?? 1);
    return Math.min(...orders);
  }, [knockoutMatches]);

  const maxCreatableStageOrder = currentPhase + 1;

  const qualifiedTeamsForStage = useMemo(() => {
    const prev = PREV_STAGE[stage];
    if (!prev) return advancingTeams;
    const prevMatches = knockoutMatches.filter((m) => m.stage === prev);
    const winners = new Set<string>();
    for (const m of prevMatches) {
      const winner = getWinner(m);
      if (winner) winners.add(winner);
    }
    return advancingTeams.filter((t) => winners.has(t.id));
  }, [stage, knockoutMatches, advancingTeams]);

  const isStageDisabled = (stageValue: string) => {
    const order = STAGE_ORDER[stageValue] ?? 99;
    if (order > maxCreatableStageOrder) return true;
    if (stageValue === "round_of_16") return false;
    const prev = PREV_STAGE[stageValue];
    if (!prev) return false;
    const prevMatches = knockoutMatches.filter((m) => m.stage === prev);
    const winnerCount = prevMatches.filter((m) => getWinner(m)).length;
    return winnerCount < 2;
  };

  const teamsAlreadyInStage = useMemo(() => {
    const inStage = knockoutMatches.filter(
      (m) => m.stage === stage && m.status !== "completed" && m.raw_status !== "completed"
    );
    const ids = new Set<string>();
    for (const m of inStage) {
      if (!isTbdTeam(m.home_team_id)) ids.add(m.home_team_id);
      if (!isTbdTeam(m.away_team_id)) ids.add(m.away_team_id);
    }
    return ids;
  }, [knockoutMatches, stage]);

  useEffect(() => {
    if (isStageDisabled(stage)) {
      const firstEnabled = STAGE_OPTIONS.find((o) => !isStageDisabled(o.value));
      if (firstEnabled) setStage(firstEnabled.value);
    }
  }, [stage, knockoutMatches, maxCreatableStageOrder]);

  useEffect(() => {
    if (homeTeamId && (teamsAlreadyInStage.has(homeTeamId) || !qualifiedTeamsForStage.some((t) => t.id === homeTeamId)))
      setHomeTeamId("");
    if (awayTeamId && (teamsAlreadyInStage.has(awayTeamId) || !qualifiedTeamsForStage.some((t) => t.id === awayTeamId)))
      setAwayTeamId("");
  }, [stage, teamsAlreadyInStage, qualifiedTeamsForStage, homeTeamId, awayTeamId]);

  const canSubmit =
    homeTeamId && awayTeamId && homeTeamId !== awayTeamId && qualifiedTeamsForStage.length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    const result = await createKnockoutMatchAction({
      tournamentId,
      stage,
      roundOrder: stageToRoundOrder(stage),
      homeTeamId,
      awayTeamId,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Create knockout match</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Stage</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as typeof stage)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {STAGE_OPTIONS.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={isStageDisabled(opt.value)}
            >
              {opt.label}
              {isStageDisabled(opt.value) ? " (not yet)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Team 1</label>
        <select
          value={homeTeamId}
          onChange={(e) => setHomeTeamId(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">Select team</option>
          {qualifiedTeamsForStage.map((t) => (
            <option
              key={t.id}
              value={t.id}
              disabled={t.id === awayTeamId || teamsAlreadyInStage.has(t.id)}
            >
              {t.name}
              {teamsAlreadyInStage.has(t.id) ? " (in match)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Team 2</label>
        <select
          value={awayTeamId}
          onChange={(e) => setAwayTeamId(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">Select team</option>
          {qualifiedTeamsForStage.map((t) => (
            <option
              key={t.id}
              value={t.id}
              disabled={t.id === homeTeamId || teamsAlreadyInStage.has(t.id)}
            >
              {t.name}
              {teamsAlreadyInStage.has(t.id) ? " (in match)" : ""}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          "Create match"
        )}
      </button>
    </form>
  );
}

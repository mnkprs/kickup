"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createKnockoutMatchAction } from "@/app/actions/tournaments";

const STAGE_OPTIONS = [
  { value: "round_of_16", label: "Round of 16" },
  { value: "quarter_final", label: "Quarter-final" },
  { value: "semi_final", label: "Semi-final" },
  { value: "final", label: "Final" },
] as const;

function stageToRoundOrder(stage: string): number {
  switch (stage) {
    case "round_of_16": return 1;
    case "quarter_final": return 1;
    case "semi_final": return 2;
    case "final": return 3;
    default: return 1;
  }
}

interface CreateKnockoutMatchFormProps {
  tournamentId: string;
  advancingTeams: { id: string; name: string; short_name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateKnockoutMatchForm({
  tournamentId,
  advancingTeams,
  onClose,
  onSuccess,
}: CreateKnockoutMatchFormProps) {
  const [stage, setStage] = useState<"round_of_16" | "quarter_final" | "semi_final" | "final">("quarter_final");
  const [homeTeamId, setHomeTeamId] = useState<string>("");
  const [awayTeamId, setAwayTeamId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    homeTeamId && awayTeamId && homeTeamId !== awayTeamId && advancingTeams.length >= 2;

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
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Home team</label>
        <select
          value={homeTeamId}
          onChange={(e) => setHomeTeamId(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">Select team</option>
          {advancingTeams.map((t) => (
            <option key={t.id} value={t.id} disabled={t.id === awayTeamId}>
              {t.short_name || t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Away team</label>
        <select
          value={awayTeamId}
          onChange={(e) => setAwayTeamId(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">Select team</option>
          {advancingTeams.map((t) => (
            <option key={t.id} value={t.id} disabled={t.id === homeTeamId}>
              {t.short_name || t.name}
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

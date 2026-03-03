"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { assignTeamsToMatchAction } from "@/app/actions/tournaments";
import type { TournamentMatchWithStage } from "@/lib/db/tournaments";
import { isTbdTeam } from "@/lib/constants";

interface AssignTeamsToMatchFormProps {
  matchId: string;
  tournamentId: string;
  stage?: string;
  homeTeamId: string;
  awayTeamId: string;
  advancingTeams: { id: string; name: string; short_name: string }[];
  knockoutMatches?: TournamentMatchWithStage[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function AssignTeamsToMatchForm({
  matchId,
  tournamentId,
  stage,
  homeTeamId,
  awayTeamId,
  advancingTeams,
  knockoutMatches = [],
  onSuccess,
  onCancel,
}: AssignTeamsToMatchFormProps) {
  const [newHomeId, setNewHomeId] = useState(isTbdTeam(homeTeamId) ? "" : homeTeamId);
  const [newAwayId, setNewAwayId] = useState(isTbdTeam(awayTeamId) ? "" : awayTeamId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamsAlreadyInOtherMatches = useMemo(() => {
    if (!stage) return new Set<string>();
    const otherMatches = knockoutMatches.filter(
      (m) =>
        m.stage === stage &&
        m.id !== matchId &&
        m.status !== "completed" &&
        m.raw_status !== "completed"
    );
    const ids = new Set<string>();
    for (const m of otherMatches) {
      if (!isTbdTeam(m.home_team_id)) ids.add(m.home_team_id);
      if (!isTbdTeam(m.away_team_id)) ids.add(m.away_team_id);
    }
    return ids;
  }, [knockoutMatches, stage, matchId]);

  const canSubmit =
    newHomeId && newAwayId && newHomeId !== newAwayId && advancingTeams.length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    const result = await assignTeamsToMatchAction({
      matchId,
      tournamentId,
      homeTeamId: newHomeId,
      awayTeamId: newAwayId,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-foreground">Assign teams</h4>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Team 1</label>
        <select
          value={newHomeId}
          onChange={(e) => setNewHomeId(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">Select team</option>
          {advancingTeams.map((t) => (
            <option
              key={t.id}
              value={t.id}
              disabled={t.id === newAwayId || teamsAlreadyInOtherMatches.has(t.id)}
            >
              {t.short_name || t.name}
              {teamsAlreadyInOtherMatches.has(t.id) ? " (in match)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1">Team 2</label>
        <select
          value={newAwayId}
          onChange={(e) => setNewAwayId(e.target.value)}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">Select team</option>
          {advancingTeams.map((t) => (
            <option
              key={t.id}
              value={t.id}
              disabled={t.id === newHomeId || teamsAlreadyInOtherMatches.has(t.id)}
            >
              {t.short_name || t.name}
              {teamsAlreadyInOtherMatches.has(t.id) ? " (in match)" : ""}
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
          "Assign teams"
        )}
      </button>
    </form>
  );
}

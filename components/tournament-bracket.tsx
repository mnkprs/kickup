"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MapPin, Clock, Trophy, UserPlus } from "lucide-react";
import type { TournamentMatchWithStage } from "@/lib/db/tournaments";
import { TeamAvatar } from "@/components/team-avatar";
import { AssignTeamsToMatchForm, isTbdTeam } from "@/components/assign-teams-to-match-form";

const STAGE_LABELS: Record<string, string> = {
  round_of_16: "Round of 16",
  quarter_final: "Quarter-finals",
  semi_final: "Semi-finals",
  final: "Final",
};

interface TournamentBracketProps {
  matches: TournamentMatchWithStage[];
  tournamentId?: string;
  canManage?: boolean;
  knockoutMode?: "auto" | "custom";
  advancingTeams?: { id: string; name: string; short_name: string }[];
  onAssignSuccess?: () => void;
}

function BracketMatch({
  match,
  label,
  tournamentId,
  canManage,
  knockoutMode,
  advancingTeams = [],
  onAssignSuccess,
}: {
  match: TournamentMatchWithStage;
  label?: string;
  tournamentId?: string;
  canManage?: boolean;
  knockoutMode?: "auto" | "custom";
  advancingTeams?: { id: string; name: string; short_name: string }[];
  onAssignSuccess?: () => void;
}) {
  const [showAssignForm, setShowAssignForm] = useState(false);
  const hasScore = match.home_score !== null && match.away_score !== null;
  const isTbd =
    canManage &&
    knockoutMode === "custom" &&
    (isTbdTeam(match.home_team_id) || isTbdTeam(match.away_team_id)) &&
    advancingTeams.length >= 2;

  const cardContent = (
    <>
      {label && (
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {label}
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <Clock size={12} className="text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">
          {match.date
            ? format(parseISO(match.date), "d MMM") + (match.time ? ` · ${match.time.slice(0, 5)}` : "")
            : hasScore
              ? "Played"
              : "TBC"}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 w-full min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <TeamAvatar team={match.home_team} size="md" />
            <span
              className="text-sm font-medium text-foreground truncate"
              title={match.home_team.name}
            >
              {match.home_team.name}
            </span>
          </div>
          <span className="text-base font-bold text-foreground tabular-nums shrink-0">
            {hasScore ? match.home_score : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 w-full min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <TeamAvatar team={match.away_team} size="md" />
            <span
              className="text-sm font-medium text-foreground truncate"
              title={match.away_team.name}
            >
              {match.away_team.name}
            </span>
          </div>
          <span className="text-base font-bold text-foreground tabular-nums shrink-0">
            {hasScore ? match.away_score : "—"}
          </span>
        </div>
      </div>
      {match.location && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <MapPin size={12} className="text-muted-foreground shrink-0" />
          <span className="text-muted-foreground text-sm truncate" title={match.location}>
            {match.location}
          </span>
        </div>
      )}
      {isTbd && !showAssignForm && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAssignForm(true);
            }}
            className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80"
          >
            <UserPlus size={14} />
            Assign teams
          </button>
        </div>
      )}
      {isTbd && showAssignForm && tournamentId && (
        <AssignTeamsToMatchForm
          matchId={match.id}
          tournamentId={tournamentId}
          homeTeamId={match.home_team_id}
          awayTeamId={match.away_team_id}
          advancingTeams={advancingTeams}
          onSuccess={() => {
            setShowAssignForm(false);
            onAssignSuccess?.();
          }}
          onCancel={() => setShowAssignForm(false)}
        />
      )}
    </>
  );

  const cardClass =
    "block rounded-xl bg-card border border-border shadow-card p-5 hover:border-accent/40 transition-colors";
  if (isTbd) {
    return (
      <div className={cardClass}>
        {cardContent}
      </div>
    );
  }
  return <Link href={`/matches/${match.id}`} className={`${cardClass} pressable`}>{cardContent}</Link>;
}

export function TournamentBracket({
  matches,
  tournamentId,
  canManage = false,
  knockoutMode = "auto",
  advancingTeams = [],
  onAssignSuccess,
}: TournamentBracketProps) {
  const knockoutMatches = matches.filter(
    (m) =>
      m.stage === "round_of_16" ||
      m.stage === "quarter_final" ||
      m.stage === "semi_final" ||
      m.stage === "final"
  );

  if (knockoutMatches.length === 0) return null;

  const byRound = new Map<number, TournamentMatchWithStage[]>();
  for (const m of knockoutMatches) {
    const order = m.round_order ?? 0;
    if (!byRound.has(order)) byRound.set(order, []);
    byRound.get(order)!.push(m);
  }
  // Latest bracket (Final) on top, earlier rounds scrolling downwards
  const rounds = [...byRound.entries()].sort(([a], [b]) => b - a);

  return (
    <section className="tournament-bracket px-5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-draw shrink-0" />
        <h2 className="text-foreground font-semibold text-base">Knockout Bracket</h2>
      </div>
      <div className="flex flex-col gap-6">
        {rounds.map(([order, roundMatches]) => {
          const stage = roundMatches[0]?.stage;
          const label = stage ? STAGE_LABELS[stage] ?? `Round ${order}` : `Round ${order}`;
          return (
            <div
              key={order}
              className="rounded-xl bg-card border border-border shadow-card p-5 flex flex-col gap-4"
            >
              <div className="text-sm font-semibold text-muted-foreground">{label}</div>
              <div className="flex flex-col gap-4">
                {roundMatches
                  .sort((a, b) => (a.match_order ?? 0) - (b.match_order ?? 0))
                  .map((m, i) => (
                    <BracketMatch
                      key={m.id}
                      match={m}
                      label={roundMatches.length > 1 ? `Match ${i + 1}` : undefined}
                      tournamentId={tournamentId}
                      canManage={canManage}
                      knockoutMode={knockoutMode}
                      advancingTeams={advancingTeams}
                      onAssignSuccess={onAssignSuccess}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

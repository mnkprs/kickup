/** Display labels for knockout stages (used in match detail, bracket, etc.) */
export const KNOCKOUT_STAGE_LABELS: Record<string, string> = {
  round_of_16: "Round of 16",
  quarter_final: "Quarter-finals",
  semi_final: "Semi-finals",
  final: "Final",
};

/** TBD placeholder team IDs used for empty knockout slots. Not user-facing. */
export const TBD_TEAM_IDS = [
  "a0000000-0000-0000-0000-000000000001",
  "a0000000-0000-0000-0000-000000000002",
] as const;

export function isTbdTeam(teamId: string): boolean {
  return (TBD_TEAM_IDS as readonly string[]).includes(teamId);
}

/** Match involves a TBD placeholder team. Such matches are shown only on tournament pages. */
export function isTbdMatch(match: { home_team_id: string; away_team_id: string }): boolean {
  return isTbdTeam(match.home_team_id) || isTbdTeam(match.away_team_id);
}

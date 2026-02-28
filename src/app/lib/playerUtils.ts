import type { MatchWithTeams } from '../types/database';

export function matchResult(match: MatchWithTeams, teamId: string): 'win' | 'loss' | 'draw' | null {
  if (match.home_score === null || match.away_score === null) return null;
  const isHome = match.home_team_id === teamId;
  const my = isHome ? match.home_score : match.away_score;
  const their = isHome ? match.away_score : match.home_score;
  if (my > their) return 'win';
  if (my < their) return 'loss';
  return 'draw';
}

export function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

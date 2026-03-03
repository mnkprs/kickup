import type { Match } from "@/lib/types";

export interface TeamMemberMin {
  id: string;
  full_name: string;
  avatar_initials: string;
  avatar_color: string;
  avatar_url: string | null;
}

export interface RosterPlayer {
  player_id: string;
  profile: Record<string, unknown>;
}

export interface MatchProposal {
  id: string;
  proposed_by_team_id: string;
  proposed_date: string;
  proposed_time: string;
  location: string;
  accepted: boolean;
  team_name?: string;
}

export interface MatchActionHistoryItem {
  actor_type: string;
  actor_name: string;
  score_home: number;
  score_away: number;
  created_at: string;
}

export interface MatchDetailClientProps {
  match: Match;
  userTeamId: string | null;
  isCaptain?: boolean;
  proposals?: MatchProposal[];
  teamMembers: TeamMemberMin[];
  homeRoster?: RosterPlayer[];
  awayRoster?: RosterPlayer[];
  initialGuestHome?: RosterPlayer[];
  initialGuestAway?: RosterPlayer[];
  homeTeamMemberIds?: string[];
  awayTeamMemberIds?: string[];
  goalsByPlayer?: Record<string, number>;
  goalsByTeam?: { home: Record<string, number>; away: Record<string, number> };
  isTournamentOrganizer?: boolean;
  isAdmin?: boolean;
  matchActionHistory?: MatchActionHistoryItem[];
}

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type MatchFormat = '5v5' | '6v6' | '7v7' | '8v8' | '11v11';
export type MatchStatus = 'pending_challenge' | 'scheduling' | 'pre_match' | 'disputed' | 'completed';
export type NotifType = 'challenge' | 'scheduling' | 'spot_applied' | 'result_confirmed' | 'bet_reminder' | 'match_reminder' | 'team_invite';
export type TeamMemberRole = 'captain' | 'player';
export type TeamMemberStatus = 'active' | 'pending';

export interface Profile {
  id: string;
  full_name: string;
  avatar_initials: string;
  avatar_color: string;
  position: PlayerPosition | null;
  area: string | null;
  bio: string;
  nationality: string | null;
  date_of_birth: string | null; // ISO date string e.g. "1995-03-15"
  height: number | null;
  preferred_foot: 'left' | 'right' | 'both' | null;
  is_freelancer: boolean;
  freelancer_until: string | null;
  is_field_owner: boolean;
  avatar_url: string | null;
  stat_matches: number;
  stat_goals: number;
  stat_assists: number;
  stat_wins: number;
  stat_mvp: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  short_name: string;
  area: string;
  format: MatchFormat;
  emoji: string;
  color: string;
  avatar_url: string | null;
  banner_url: string | null;
  description: string;
  open_spots: number;
  searching_for_opponent: boolean;
  record_w: number;
  record_d: number;
  record_l: number;
  record_gf: number;
  record_ga: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  player_id: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  joined_at: string;
  profiles?: Profile;
}

export interface TeamWithMembers extends Team {
  team_members: TeamMember[];
}

export interface MatchProposal {
  id: string;
  match_id: string;
  proposed_by_team_id: string;
  proposed_date: string;
  proposed_time: string;
  location: string;
  accepted: boolean;
  created_at: string;
  proposed_by_team?: Team;
}

export interface MatchLineup {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  profiles?: Profile;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  scorer_id: string;
  assist_id: string | null;
  minute: number | null;
  created_at: string;
  scorer?: Profile;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  format: MatchFormat;
  status: MatchStatus;
  match_date: string | null;
  match_time: string | null;
  location: string | null;
  area: string | null;
  bet: string | null;
  home_score: number | null;
  away_score: number | null;
  mvp_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchWithTeams extends Match {
  home_team: Team | null;
  away_team: Team | null;
}

export interface MatchFull extends MatchWithTeams {
  match_lineups: MatchLineup[];
  match_proposals: MatchProposal[];
  match_events: MatchEvent[];
}

export type TournamentStatus = 'registration' | 'group_stage' | 'knockout_stage' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  organizer_id: string;
  venue: string;
  area: string;
  match_format: MatchFormat;
  max_teams: number;
  teams_per_group: number;
  prize: string;
  start_date: string | null;
  end_date: string | null;
  status: TournamentStatus;
  created_at: string;
  updated_at: string;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  team_id: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  teams?: Team;
}

export interface TournamentGroup {
  id: string;
  tournament_id: string;
  team_id: string;
  group_label: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  match_id: string;
  stage: 'group' | 'semi_final' | 'final';
  group_label: string | null;
  match_order: number;
  matches?: MatchWithTeams;
}

export interface TournamentStandingsRow {
  rank: number;
  team_id: string;
  name: string;
  emoji: string;
  played: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export type OwnerApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface OwnerApplication {
  id: string;
  user_id: string;
  message: string;
  status: OwnerApplicationStatus;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  team_id: string | null;
  match_id: string | null;
  tournament_id: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
  created_at: string;
}

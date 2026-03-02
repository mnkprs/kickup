// Canonical types derived from Kickup DB schema.
// Field names match mock-data.ts conventions to minimise component churn.

export interface Profile {
  id: string;
  full_name: string;
  avatar_initials: string;
  avatar_color: string;
  avatar_url?: string | null;
  position: string | null;
  area: string | null;
  bio: string;
  is_freelancer: boolean;
  freelancer_until?: string | null;
  is_field_owner: boolean;
  is_admin: boolean;
  // aggregate stats
  matches_played: number;
  goals: number;
  wins: number;
  draws: number;
  losses: number;
  man_of_match: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets: number;
  // meta
  team_id?: string | null;
  joined_date?: string | null;
  created_at: string;
  preferred_theme?: "light" | "dark";
}

export interface Team {
  id: string;
  name: string;
  short_name: string;
  area: string;
  format: string;
  emoji: string;
  color: string;
  description: string;
  open_spots: number;
  // record
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
  // optional
  captain_id?: string | null;
  home_ground?: string | null;
  searching_for_opponent?: boolean;
  searching_for_players?: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  player_id: string;
  role: "captain" | "player";
  joined_at: string;
  profile?: Profile;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team: Team;
  away_team: Team;
  format: string;
  // normalized status for display
  status: "upcoming" | "live" | "completed" | string;
  // raw DB status: pending_challenge | scheduling | pre_match | disputed | completed
  raw_status: string;
  date: string | null;
  time: string | null;
  location: string | null;
  home_score: number | null;
  away_score: number | null;
  created_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  scorer_id: string;
  scorer?: Profile;
  minute: number | null;
  created_at: string;
}

export interface TournamentPendingRegistration {
  id: string;
  team_id: string;
  team: Team;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  organizer_id: string;
  organizer: string;
  venue: string;
  area: string;
  format: string; // bracket format: knockout | round_robin | group_stage
  match_format: string; // playing format: 5v5 | 7v7 | 11v11
  max_teams: number;
  prize: string;
  entry_fee: string;
  start_date: string | null;
  end_date: string | null;
  // normalized status: 'upcoming' | 'in_progress' | 'completed'
  status: "upcoming" | "in_progress" | "completed";
  // raw DB status for organizer controls: 'registration' | 'group_stage' | 'knockout_stage' | 'completed'
  raw_status?: string;
  teams_count: number;
  matches_played: number;
  total_matches: number;
  enrolled_teams: Team[];
  pending_registrations: TournamentPendingRegistration[];
  created_at: string;
}

export interface TournamentStanding {
  rank: number;
  team_id: string;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
}

export interface AreaGroup {
  city: string;
  areas: string[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  match_id: string | null;
  team_id: string | null;
  tournament_id: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
  created_at: string;
}

export interface OwnerApplication {
  id: string;
  user_id: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface TopScorer {
  player: Profile;
  team_short_name: string;
  goals: number;
}

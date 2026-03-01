// Mock data reflecting the Kickup Supabase schema:
// tables: profiles, teams, matches, match_lineups, match_events, tournaments

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  position: string | null;
  area: string | null;
  goals: number;
  assists: number;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  team_id?: string;
  joined_date?: string;
  bio?: string;
  yellow_cards?: number;
  red_cards?: number;
  clean_sheets?: number;
  man_of_match?: number;
}

export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  area: string;
  wins: number;
  losses: number;
  draws: number;
  goals_for: number;
  goals_against: number;
  points: number;
  founded?: string;
  captain_id?: string;
  home_ground?: string;
  members?: Profile[];
}

export interface Match {
  id: string;
  home_team: Team;
  away_team: Team;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "live" | "completed";
  home_score: number | null;
  away_score: number | null;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  scorer: Profile;
  minute: number;
  event_type: "goal" | "assist" | "yellow_card" | "red_card";
}

export interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  teams_count: number;
  max_teams: number;
  status: "upcoming" | "in_progress" | "completed";
  format: "knockout" | "round_robin" | "group_stage";
  area: string;
  organizer: string;
  prize: string | null;
  entry_fee: string | null;
  description: string;
  enrolled_teams: Team[];
  matches_played: number;
  total_matches: number;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: string;
  home_team: Team;
  away_team: Team;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "live" | "completed";
  home_score: number | null;
  away_score: number | null;
}

export interface TournamentStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

// Current user
export const currentUser: Profile = {
  id: "usr_001",
  full_name: "Marcus Reed",
  avatar_url: null,
  position: "CM",
  area: "East London",
  goals: 23,
  assists: 15,
  matches_played: 42,
  wins: 24,
  losses: 10,
  draws: 8,
  team_id: "team_001",
  joined_date: "2024-09-01",
  bio: "Central midfielder with an eye for a pass. Weekend warrior since 2019.",
  yellow_cards: 4,
  red_cards: 0,
  clean_sheets: 12,
  man_of_match: 7,
};

// Teammates for Hackney United
export const teammates: Profile[] = [
  currentUser,
  {
    id: "usr_002",
    full_name: "Jaylen Carter",
    avatar_url: null,
    position: "ST",
    area: "South London",
    goals: 19,
    assists: 8,
    matches_played: 38,
    wins: 20,
    losses: 12,
    draws: 6,
    team_id: "team_001",
    joined_date: "2024-09-01",
    yellow_cards: 6,
    red_cards: 1,
    man_of_match: 5,
  },
  {
    id: "usr_003",
    full_name: "Kofi Mensah",
    avatar_url: null,
    position: "RW",
    area: "North London",
    goals: 16,
    assists: 12,
    matches_played: 35,
    wins: 18,
    losses: 10,
    draws: 7,
    team_id: "team_001",
    joined_date: "2025-01-15",
    yellow_cards: 2,
    red_cards: 0,
    man_of_match: 4,
  },
  {
    id: "usr_006",
    full_name: "Owen Phillips",
    avatar_url: null,
    position: "GK",
    area: "East London",
    goals: 0,
    assists: 1,
    matches_played: 40,
    wins: 23,
    losses: 10,
    draws: 7,
    team_id: "team_001",
    joined_date: "2024-09-01",
    yellow_cards: 1,
    red_cards: 0,
    clean_sheets: 18,
    man_of_match: 8,
  },
  {
    id: "usr_007",
    full_name: "Tunde Bakare",
    avatar_url: null,
    position: "CB",
    area: "East London",
    goals: 3,
    assists: 2,
    matches_played: 38,
    wins: 22,
    losses: 9,
    draws: 7,
    team_id: "team_001",
    joined_date: "2024-10-05",
    yellow_cards: 7,
    red_cards: 1,
    man_of_match: 3,
  },
  {
    id: "usr_008",
    full_name: "Liam Donovan",
    avatar_url: null,
    position: "CB",
    area: "East London",
    goals: 2,
    assists: 0,
    matches_played: 36,
    wins: 20,
    losses: 10,
    draws: 6,
    team_id: "team_001",
    joined_date: "2024-09-01",
    yellow_cards: 5,
    red_cards: 0,
    man_of_match: 2,
  },
  {
    id: "usr_009",
    full_name: "Rashid Ali",
    avatar_url: null,
    position: "LB",
    area: "East London",
    goals: 1,
    assists: 9,
    matches_played: 34,
    wins: 19,
    losses: 9,
    draws: 6,
    team_id: "team_001",
    joined_date: "2025-02-01",
    yellow_cards: 3,
    red_cards: 0,
    man_of_match: 2,
  },
  {
    id: "usr_010",
    full_name: "Eoin Murphy",
    avatar_url: null,
    position: "RB",
    area: "East London",
    goals: 1,
    assists: 7,
    matches_played: 32,
    wins: 18,
    losses: 8,
    draws: 6,
    team_id: "team_001",
    joined_date: "2025-03-10",
    yellow_cards: 2,
    red_cards: 0,
    man_of_match: 1,
  },
  {
    id: "usr_011",
    full_name: "Callum Wright",
    avatar_url: null,
    position: "CDM",
    area: "East London",
    goals: 4,
    assists: 6,
    matches_played: 30,
    wins: 17,
    losses: 8,
    draws: 5,
    team_id: "team_001",
    joined_date: "2025-01-20",
    yellow_cards: 8,
    red_cards: 0,
    man_of_match: 2,
  },
  {
    id: "usr_012",
    full_name: "Diego Almeida",
    avatar_url: null,
    position: "LW",
    area: "East London",
    goals: 11,
    assists: 10,
    matches_played: 28,
    wins: 16,
    losses: 7,
    draws: 5,
    team_id: "team_001",
    joined_date: "2025-06-01",
    yellow_cards: 3,
    red_cards: 0,
    man_of_match: 4,
  },
  {
    id: "usr_013",
    full_name: "Nathan Cole",
    avatar_url: null,
    position: "CAM",
    area: "East London",
    goals: 8,
    assists: 14,
    matches_played: 26,
    wins: 15,
    losses: 6,
    draws: 5,
    team_id: "team_001",
    joined_date: "2025-08-15",
    yellow_cards: 1,
    red_cards: 0,
    man_of_match: 3,
  },
];

// Teams
export const teams: Team[] = [
  {
    id: "team_001",
    name: "Hackney United",
    short_name: "HKU",
    logo_url: null,
    area: "East London",
    wins: 18,
    losses: 4,
    draws: 3,
    goals_for: 52,
    goals_against: 21,
    points: 57,
    founded: "2024-09",
    captain_id: "usr_001",
    home_ground: "Hackney Marshes Pitch 3",
    members: teammates,
  },
  {
    id: "team_002",
    name: "Brixton FC",
    short_name: "BFC",
    logo_url: null,
    area: "South London",
    wins: 16,
    losses: 5,
    draws: 4,
    goals_for: 48,
    goals_against: 28,
    points: 52,
    founded: "2023-06",
    home_ground: "Brockwell Park",
  },
  {
    id: "team_003",
    name: "Camden Rovers",
    short_name: "CMR",
    logo_url: null,
    area: "North London",
    wins: 14,
    losses: 6,
    draws: 5,
    goals_for: 41,
    goals_against: 25,
    points: 47,
    founded: "2022-01",
    home_ground: "Regent's Park South",
  },
  {
    id: "team_004",
    name: "Shoreditch Athletic",
    short_name: "SHA",
    logo_url: null,
    area: "East London",
    wins: 12,
    losses: 8,
    draws: 5,
    goals_for: 38,
    goals_against: 30,
    points: 41,
    founded: "2023-11",
    home_ground: "Victoria Park",
  },
  {
    id: "team_005",
    name: "Peckham Rangers",
    short_name: "PKR",
    logo_url: null,
    area: "South London",
    wins: 10,
    losses: 9,
    draws: 6,
    goals_for: 35,
    goals_against: 33,
    points: 36,
    founded: "2024-02",
    home_ground: "Peckham Rye Park",
  },
  {
    id: "team_006",
    name: "Islington Lions",
    short_name: "ISL",
    logo_url: null,
    area: "North London",
    wins: 9,
    losses: 10,
    draws: 6,
    goals_for: 30,
    goals_against: 32,
    points: 33,
    founded: "2024-04",
    home_ground: "Highbury Fields",
  },
];

// Matches
export const matches: Match[] = [
  {
    id: "match_001",
    home_team: teams[0],
    away_team: teams[1],
    date: "2026-03-04",
    time: "19:00",
    location: "Hackney Marshes Pitch 3",
    status: "upcoming",
    home_score: null,
    away_score: null,
  },
  {
    id: "match_002",
    home_team: teams[2],
    away_team: teams[3],
    date: "2026-03-07",
    time: "14:00",
    location: "Regent's Park South",
    status: "upcoming",
    home_score: null,
    away_score: null,
  },
  {
    id: "match_003",
    home_team: teams[4],
    away_team: teams[0],
    date: "2026-03-10",
    time: "18:30",
    location: "Peckham Rye Park",
    status: "upcoming",
    home_score: null,
    away_score: null,
  },
  {
    id: "match_004",
    home_team: teams[0],
    away_team: teams[2],
    date: "2026-02-27",
    time: "19:00",
    location: "Hackney Marshes Pitch 1",
    status: "completed",
    home_score: 3,
    away_score: 1,
  },
  {
    id: "match_005",
    home_team: teams[3],
    away_team: teams[0],
    date: "2026-02-22",
    time: "15:00",
    location: "Victoria Park",
    status: "completed",
    home_score: 2,
    away_score: 2,
  },
  {
    id: "match_006",
    home_team: teams[0],
    away_team: teams[5],
    date: "2026-02-18",
    time: "19:30",
    location: "Hackney Marshes Pitch 5",
    status: "completed",
    home_score: 4,
    away_score: 0,
  },
  {
    id: "match_007",
    home_team: teams[1],
    away_team: teams[0],
    date: "2026-02-14",
    time: "16:00",
    location: "Brockwell Park",
    status: "completed",
    home_score: 1,
    away_score: 3,
  },
];

// Top scorers
export const topScorers: { player: Profile; team_short_name: string }[] = [
  {
    player: {
      ...currentUser,
      goals: 23,
    },
    team_short_name: "HKU",
  },
  {
    player: {
      id: "usr_002",
      full_name: "Jaylen Carter",
      avatar_url: null,
      position: "ST",
      area: "South London",
      goals: 19,
      assists: 8,
      matches_played: 38,
      wins: 20,
      losses: 12,
      draws: 6,
    },
    team_short_name: "BFC",
  },
  {
    player: {
      id: "usr_003",
      full_name: "Kofi Mensah",
      avatar_url: null,
      position: "RW",
      area: "North London",
      goals: 16,
      assists: 12,
      matches_played: 35,
      wins: 18,
      losses: 10,
      draws: 7,
    },
    team_short_name: "CMR",
  },
  {
    player: {
      id: "usr_004",
      full_name: "Declan O'Brien",
      avatar_url: null,
      position: "CF",
      area: "East London",
      goals: 14,
      assists: 5,
      matches_played: 32,
      wins: 14,
      losses: 12,
      draws: 6,
    },
    team_short_name: "SHA",
  },
  {
    player: {
      id: "usr_005",
      full_name: "Tariq Hassan",
      avatar_url: null,
      position: "LW",
      area: "South London",
      goals: 12,
      assists: 9,
      matches_played: 30,
      wins: 12,
      losses: 11,
      draws: 7,
    },
    team_short_name: "PKR",
  },
];

// Tournaments
export const tournaments: Tournament[] = [
  {
    id: "tourney_001",
    name: "East London Cup 2026",
    start_date: "2026-03-15",
    end_date: "2026-04-12",
    teams_count: 6,
    max_teams: 8,
    status: "upcoming",
    format: "knockout",
    area: "East London",
    organizer: "East London FA",
    prize: "Trophy + Kit Vouchers",
    entry_fee: "25/player",
    description:
      "Annual knockout tournament open to all amateur sides in the East London area. 8-team single elimination bracket with third-place playoff.",
    enrolled_teams: [teams[0], teams[3], teams[1], teams[4], teams[2], teams[5]],
    matches_played: 0,
    total_matches: 7,
  },
  {
    id: "tourney_002",
    name: "Sunday League Spring",
    start_date: "2026-02-01",
    end_date: "2026-05-30",
    teams_count: 6,
    max_teams: 6,
    status: "in_progress",
    format: "round_robin",
    area: "London-wide",
    organizer: "London Sunday League",
    prize: "League Shield",
    entry_fee: "50/team",
    description:
      "The flagship spring round-robin league. All teams play each other home and away across 10 matchdays.",
    enrolled_teams: teams.slice(0, 6),
    matches_played: 14,
    total_matches: 30,
  },
  {
    id: "tourney_003",
    name: "South London 5-a-side",
    start_date: "2026-04-20",
    end_date: "2026-04-20",
    teams_count: 3,
    max_teams: 16,
    status: "upcoming",
    format: "group_stage",
    area: "South London",
    organizer: "Brockwell Park FC",
    prize: "Cash Prize Pool",
    entry_fee: "15/player",
    description:
      "One-day 5-a-side blitz. 4 groups of 4, top 2 advance to knockout rounds. Fast-paced, small-sided fun.",
    enrolled_teams: [teams[1], teams[4], teams[5]],
    matches_played: 0,
    total_matches: 24,
  },
  {
    id: "tourney_004",
    name: "Winter League 2025",
    start_date: "2025-10-01",
    end_date: "2026-01-25",
    teams_count: 6,
    max_teams: 6,
    status: "completed",
    format: "round_robin",
    area: "London-wide",
    organizer: "London Sunday League",
    prize: "League Shield",
    entry_fee: "50/team",
    description: "The autumn/winter round-robin league. Completed season.",
    enrolled_teams: teams.slice(0, 6),
    matches_played: 30,
    total_matches: 30,
  },
];

// Tournament-specific matches (for "Sunday League Spring" -- tourney_002)
export const tournamentMatches: TournamentMatch[] = [
  {
    id: "tm_001",
    tournament_id: "tourney_002",
    round: "Matchday 5",
    home_team: teams[0],
    away_team: teams[1],
    date: "2026-03-04",
    time: "14:00",
    location: "Hackney Marshes Pitch 3",
    status: "upcoming",
    home_score: null,
    away_score: null,
  },
  {
    id: "tm_002",
    tournament_id: "tourney_002",
    round: "Matchday 5",
    home_team: teams[2],
    away_team: teams[3],
    date: "2026-03-04",
    time: "14:00",
    location: "Regent's Park South",
    status: "upcoming",
    home_score: null,
    away_score: null,
  },
  {
    id: "tm_003",
    tournament_id: "tourney_002",
    round: "Matchday 5",
    home_team: teams[4],
    away_team: teams[5],
    date: "2026-03-04",
    time: "16:00",
    location: "Peckham Rye Park",
    status: "upcoming",
    home_score: null,
    away_score: null,
  },
  {
    id: "tm_004",
    tournament_id: "tourney_002",
    round: "Matchday 4",
    home_team: teams[0],
    away_team: teams[2],
    date: "2026-02-27",
    time: "14:00",
    location: "Hackney Marshes Pitch 1",
    status: "completed",
    home_score: 3,
    away_score: 1,
  },
  {
    id: "tm_005",
    tournament_id: "tourney_002",
    round: "Matchday 4",
    home_team: teams[3],
    away_team: teams[0],
    date: "2026-02-22",
    time: "15:00",
    location: "Victoria Park",
    status: "completed",
    home_score: 2,
    away_score: 2,
  },
  {
    id: "tm_006",
    tournament_id: "tourney_002",
    round: "Matchday 3",
    home_team: teams[0],
    away_team: teams[5],
    date: "2026-02-18",
    time: "19:30",
    location: "Hackney Marshes Pitch 5",
    status: "completed",
    home_score: 4,
    away_score: 0,
  },
];

// Tournament standings (for "Sunday League Spring" -- tourney_002)
export const tournamentStandings: TournamentStanding[] = [
  { team: teams[0], played: 4, won: 3, drawn: 1, lost: 0, goals_for: 12, goals_against: 4, points: 10 },
  { team: teams[1], played: 4, won: 3, drawn: 0, lost: 1, goals_for: 10, goals_against: 5, points: 9 },
  { team: teams[2], played: 4, won: 2, drawn: 1, lost: 1, goals_for: 7, goals_against: 6, points: 7 },
  { team: teams[3], played: 4, won: 1, drawn: 2, lost: 1, goals_for: 6, goals_against: 5, points: 5 },
  { team: teams[4], played: 4, won: 1, drawn: 0, lost: 3, goals_for: 4, goals_against: 9, points: 3 },
  { team: teams[5], played: 4, won: 0, drawn: 0, lost: 4, goals_for: 2, goals_against: 12, points: 0 },
];

// Top scorers for "Sunday League Spring"
export const tournamentTopScorers = [
  { player: topScorers[0].player, team_short_name: "HKU", goals: 6, assists: 3 },
  { player: topScorers[1].player, team_short_name: "BFC", goals: 5, assists: 2 },
  { player: topScorers[2].player, team_short_name: "CMR", goals: 4, assists: 4 },
  { player: topScorers[3].player, team_short_name: "SHA", goals: 3, assists: 1 },
  { player: topScorers[4].player, team_short_name: "PKR", goals: 2, assists: 2 },
];

// Weekly performance data for charts
export const weeklyPerformance = [
  { week: "W1", goals: 2, assists: 1, matches: 2 },
  { week: "W2", goals: 3, assists: 0, matches: 2 },
  { week: "W3", goals: 1, assists: 2, matches: 1 },
  { week: "W4", goals: 4, assists: 1, matches: 3 },
  { week: "W5", goals: 2, assists: 3, matches: 2 },
  { week: "W6", goals: 3, assists: 1, matches: 2 },
  { week: "W7", goals: 1, assists: 2, matches: 1 },
  { week: "W8", goals: 5, assists: 1, matches: 3 },
];

// Monthly performance data for profile page
export const monthlyPerformance = [
  { month: "Oct", goals: 3, assists: 2, matches: 5 },
  { month: "Nov", goals: 5, assists: 3, matches: 6 },
  { month: "Dec", goals: 2, assists: 1, matches: 4 },
  { month: "Jan", goals: 4, assists: 4, matches: 7 },
  { month: "Feb", goals: 6, assists: 3, matches: 8 },
  { month: "Mar", goals: 3, assists: 2, matches: 5 },
];

// Recent activity feed for profile
export const recentActivity = [
  { id: "act_1", type: "goal" as const, description: "Scored 2 goals vs Camden Rovers", date: "2026-02-27", match_id: "match_004" },
  { id: "act_2", type: "win" as const, description: "Won 3-1 vs Camden Rovers", date: "2026-02-27", match_id: "match_004" },
  { id: "act_3", type: "draw" as const, description: "Drew 2-2 vs Shoreditch Athletic", date: "2026-02-22", match_id: "match_005" },
  { id: "act_4", type: "goal" as const, description: "Scored hat-trick vs Islington Lions", date: "2026-02-18", match_id: "match_006" },
  { id: "act_5", type: "win" as const, description: "Won 4-0 vs Islington Lions", date: "2026-02-18", match_id: "match_006" },
  { id: "act_6", type: "motm" as const, description: "Man of the Match vs Brixton FC", date: "2026-02-14", match_id: "match_007" },
  { id: "act_7", type: "win" as const, description: "Won 3-1 at Brixton FC", date: "2026-02-14", match_id: "match_007" },
];

// Achievements / badges
export const achievements = [
  { id: "ach_1", name: "Top Scorer", description: "Lead the league in goals", icon: "crosshair" as const, unlocked: true },
  { id: "ach_2", name: "Playmaker", description: "10+ assists in a season", icon: "handshake" as const, unlocked: true },
  { id: "ach_3", name: "Iron Man", description: "40+ matches played", icon: "shield" as const, unlocked: true },
  { id: "ach_4", name: "Hat-trick Hero", description: "Score 3 goals in a match", icon: "flame" as const, unlocked: true },
  { id: "ach_5", name: "Clean Sheet King", description: "Win 10+ matches with clean sheets", icon: "lock" as const, unlocked: true },
  { id: "ach_6", name: "Century Club", description: "Score 100 career goals", icon: "trophy" as const, unlocked: false },
];

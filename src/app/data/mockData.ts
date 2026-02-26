export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export type Format = '5v5' | '6v6' | '7v7' | '8v8';
export type MatchStatus = 'upcoming' | 'pending_challenge' | 'scheduling' | 'pre_match' | 'disputed' | 'completed';
export type NotifType = 'challenge' | 'scheduling' | 'spot_applied' | 'result_confirmed' | 'bet_reminder' | 'match_reminder';

export interface Player {
  id: string;
  name: string;
  position: Position;
  area: string;
  teamId: string | null;
  isFreelancer: boolean;
  avatarColor: string;
  avatarInitials: string;
  stats: { matches: number; goals: number; assists: number; wins: number; mvp: number };
  matchHistory: { matchId: string; opponent: string; score: string; date: string; goals: number }[];
  bio: string;
  freelancerAvailableDate?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  area: string;
  format: Format;
  emoji: string;
  color: string;
  bannerUrl?: string;
  description: string;
  roster: string[];
  openSpots: number;
  searchingForOpponent: boolean;
  record: { w: number; d: number; l: number; gf: number; ga: number };
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  format: Format;
  status: MatchStatus;
  date?: string;
  time?: string;
  location?: string;
  area?: string;
  score?: { home: number; away: number };
  bet?: string;
  mvpId?: string;
  topScorerName?: string;
  topScorerGoals?: number;
  proposals?: MatchProposal[];
  homeLineup?: string[];
  awayLineup?: string[];
  notes?: string;
}

export interface MatchProposal {
  id: string;
  proposedByTeamId: string;
  date: string;
  time: string;
  location: string;
  accepted: boolean;
}

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  teamId?: string;
  matchId?: string;
  avatarEmoji?: string;
  avatarColor?: string;
}

// ─── PLAYERS ──────────────────────────────────────────────────────────────────
export const players: Player[] = [
  {
    id: 'p1', name: 'Nikos Papadopoulos', position: 'FWD', area: 'Kolonaki',
    teamId: 't1', isFreelancer: false, avatarColor: '#2E7D32', avatarInitials: 'NP',
    bio: 'Striker with a nose for goal. Left foot wizard. Free on weekends.',
    stats: { matches: 42, goals: 28, assists: 11, wins: 24, mvp: 5 },
    matchHistory: [
      { matchId: 'm1', opponent: 'Piraeus Pirates', score: '3-1', date: '12 Feb', goals: 2 },
      { matchId: 'm2', opponent: 'Glyfada Gladiators', score: '2-2', date: '5 Feb', goals: 1 },
      { matchId: 'm3', opponent: 'Kifisia FC', score: '4-0', date: '27 Jan', goals: 3 },
    ],
  },
  {
    id: 'p2', name: 'Giorgos Stavros', position: 'GK', area: 'Piraeus',
    teamId: 't2', isFreelancer: false, avatarColor: '#1565C0', avatarInitials: 'GS',
    bio: 'Shot-stopper since 2012. Captain of Piraeus Pirates. Organizer.',
    stats: { matches: 55, goals: 0, assists: 2, wins: 30, mvp: 8 },
    matchHistory: [
      { matchId: 'm4', opponent: 'Kolonaki Kings', score: '1-3', date: '12 Feb', goals: 0 },
    ],
  },
  {
    id: 'p3', name: 'Alexis Dimos', position: 'MID', area: 'Exarcheia',
    teamId: 't4', isFreelancer: false, avatarColor: '#6A1B9A', avatarInitials: 'AD',
    bio: 'Box-to-box midfielder. Vision and stamina. Weekly 5-a-side veteran.',
    stats: { matches: 38, goals: 9, assists: 22, wins: 18, mvp: 4 },
    matchHistory: [],
  },
  {
    id: 'p4', name: 'Kostas Nikolaou', position: 'DEF', area: 'Glyfada',
    teamId: 't3', isFreelancer: false, avatarColor: '#BF360C', avatarInitials: 'KN',
    bio: 'Centre-back. Reads the game well. Tall and aggressive in the air.',
    stats: { matches: 29, goals: 3, assists: 5, wins: 17, mvp: 2 },
    matchHistory: [],
  },
  {
    id: 'p5', name: 'Yiannis Tzanakis', position: 'MID', area: 'Kifisia',
    teamId: null, isFreelancer: true, avatarColor: '#E65100', avatarInitials: 'YT',
    bio: 'Freelancer. Available every Saturday. Quick with good technique.',
    freelancerAvailableDate: 'This Saturday, 1 Mar',
    stats: { matches: 61, goals: 14, assists: 31, wins: 35, mvp: 7 },
    matchHistory: [],
  },
  {
    id: 'p6', name: 'Spyros Athanasiou', position: 'FWD', area: 'Pangrati',
    teamId: null, isFreelancer: true, avatarColor: '#00695C', avatarInitials: 'SA',
    bio: 'Tricky winger. Fast and direct. Looking for a 5v5 team.',
    freelancerAvailableDate: 'Sunday, 2 Mar',
    stats: { matches: 22, goals: 18, assists: 8, wins: 12, mvp: 3 },
    matchHistory: [],
  },
  {
    id: 'p7', name: 'Christos Melas', position: 'GK', area: 'Nea Smyrni',
    teamId: null, isFreelancer: true, avatarColor: '#37474F', avatarInitials: 'CM',
    bio: 'Experienced keeper. Good with feet too. Free agent since Jan.',
    freelancerAvailableDate: 'Flexible',
    stats: { matches: 47, goals: 0, assists: 1, wins: 28, mvp: 9 },
    matchHistory: [],
  },
  {
    id: 'p8', name: 'Petros Katsaros', position: 'DEF', area: 'Chalandri',
    teamId: 't8', isFreelancer: false, avatarColor: '#558B2F', avatarInitials: 'PK',
    bio: 'Solid left back. Set-piece delivery specialist.',
    stats: { matches: 33, goals: 4, assists: 9, wins: 20, mvp: 1 },
    matchHistory: [],
  },
];

// ─── TEAMS ────────────────────────────────────────────────────────────────────
export const teams: Team[] = [
  {
    id: 't1', name: 'Kolonaki Kings', shortName: 'KKG', area: 'Kolonaki', format: '5v5',
    emoji: '👑', color: '#2E7D32',
    bannerUrl: 'https://images.unsplash.com/photo-1601788505117-18947ac4f2e6?w=800&q=80',
    description: 'The original Kings of Kolonaki. We play hard, celebrate harder. Thursdays & Saturdays.',
    roster: ['p1', 'p4'], openSpots: 1, searchingForOpponent: true,
    record: { w: 14, d: 3, l: 2, gf: 54, ga: 22 },
  },
  {
    id: 't2', name: 'Piraeus Pirates', shortName: 'PPR', area: 'Piraeus', format: '7v7',
    emoji: '⚡', color: '#1565C0',
    bannerUrl: 'https://images.unsplash.com/photo-1764438246710-83c535cada80?w=800&q=80',
    description: 'Harbourside warriors. Any weather, any pitch. Just show up with boots.',
    roster: ['p2'], openSpots: 2, searchingForOpponent: true,
    record: { w: 9, d: 4, l: 6, gf: 38, ga: 31 },
  },
  {
    id: 't3', name: 'Glyfada Gladiators', shortName: 'GGL', area: 'Glyfada', format: '6v6',
    emoji: '🛡️', color: '#BF360C',
    description: 'Coastal warriors. Beachside training, pitch-ready always.',
    roster: ['p4'], openSpots: 0, searchingForOpponent: false,
    record: { w: 10, d: 3, l: 4, gf: 44, ga: 27 },
  },
  {
    id: 't4', name: 'Exarcheia United', shortName: 'EXU', area: 'Exarcheia', format: '5v5',
    emoji: '✊', color: '#6A1B9A',
    description: 'Neighbourhood club. Everyone plays, everyone wins together.',
    roster: ['p3'], openSpots: 2, searchingForOpponent: true,
    record: { w: 7, d: 5, l: 6, gf: 29, ga: 32 },
  },
  {
    id: 't5', name: 'Kifisia FC', shortName: 'KFC', area: 'Kifisia', format: '7v7',
    emoji: '🌿', color: '#33691E',
    description: 'Northern Athens finest. Well-organized, technical play preferred.',
    roster: [], openSpots: 3, searchingForOpponent: true,
    record: { w: 16, d: 3, l: 1, gf: 62, ga: 14 },
  },
  {
    id: 't6', name: 'Nea Smyrni Stars', shortName: 'NSS', area: 'Nea Smyrni', format: '6v6',
    emoji: '⭐', color: '#F9A825',
    description: 'Southern Athens crew. Playing every Sunday morning rain or shine.',
    roster: [], openSpots: 0, searchingForOpponent: false,
    record: { w: 5, d: 7, l: 8, gf: 25, ga: 38 },
  },
  {
    id: 't7', name: 'Pangrati Panthers', shortName: 'PGP', area: 'Pangrati', format: '5v5',
    emoji: '🐆', color: '#4E342E',
    description: 'Fast and furious. The old-timers of Pangrati. Est. 2015.',
    roster: [], openSpots: 1, searchingForOpponent: true,
    record: { w: 11, d: 4, l: 5, gf: 47, ga: 30 },
  },
  {
    id: 't8', name: 'Chalandri Chiefs', shortName: 'CHC', area: 'Chalandri', format: '8v8',
    emoji: '🔥', color: '#B71C1C',
    description: 'Northeast Athens stronghold. Big pitch, big ambitions.',
    roster: ['p8'], openSpots: 4, searchingForOpponent: true,
    record: { w: 6, d: 2, l: 7, gf: 22, ga: 30 },
  },
];

// ─── MATCHES ──────────────────────────────────────────────────────────────────
export const matches: Match[] = [
  {
    id: 'm1', homeTeamId: 't1', awayTeamId: 't2', format: '5v5',
    status: 'completed', date: '12 Feb 2026', time: '19:00',
    location: 'SEGAS Indoor, Kolonaki', area: 'Kolonaki',
    score: { home: 3, away: 1 },
    topScorerName: 'N. Papadopoulos', topScorerGoals: 2,
    mvpId: 'p1', bet: 'Losers buy souvlaki for the whole team!',
    notes: 'Dominant win. Defensive unit was solid.',
  },
  {
    id: 'm2', homeTeamId: 't3', awayTeamId: 't4', format: '6v6',
    status: 'completed', date: '10 Feb 2026', time: '20:30',
    location: 'Glyfada Sports Center', area: 'Glyfada',
    score: { home: 2, away: 2 },
    topScorerName: 'A. Dimos', topScorerGoals: 2, mvpId: 'p3',
  },
  {
    id: 'm3', homeTeamId: 't1', awayTeamId: 't5', format: '5v5',
    status: 'pre_match', date: '1 Mar 2026', time: '18:00',
    location: 'SEGAS Indoor, Kolonaki', area: 'Kolonaki',
    bet: 'Losers buy coffee for winners',
    homeLineup: ['p1', 'p4'], awayLineup: [],
  },
  {
    id: 'm4', homeTeamId: 't2', awayTeamId: 't7', format: '7v7',
    status: 'scheduling',
    proposals: [
      { id: 'pr1', proposedByTeamId: 't2', date: '2 Mar 2026', time: '19:00', location: 'Piraeus Municipal Field', accepted: false },
      { id: 'pr2', proposedByTeamId: 't7', date: '5 Mar 2026', time: '20:00', location: 'Pangrati Synthetic Pitch', accepted: false },
      { id: 'pr3', proposedByTeamId: 't2', date: '7 Mar 2026', time: '18:30', location: 'Piraeus Municipal Field', accepted: true },
    ],
  },
  {
    id: 'm5', homeTeamId: 't4', awayTeamId: 't8', format: '5v5',
    status: 'pending_challenge',
  },
  {
    id: 'm6', homeTeamId: 't5', awayTeamId: 't6', format: '7v7',
    status: 'completed', date: '5 Feb 2026', time: '17:00',
    location: 'Kifisia Sports Complex', area: 'Kifisia',
    score: { home: 5, away: 0 },
    topScorerName: 'D. Petridis', topScorerGoals: 3,
  },
  {
    id: 'm7', homeTeamId: 't3', awayTeamId: 't1', format: '6v6',
    status: 'disputed', date: '15 Feb 2026',
    notes: 'Score disagreement: Gladiators claim 3-2, Kings claim 2-3. Pending admin review.',
  },
];

// ─── CURRENT USER ─────────────────────────────────────────────────────────────
export const currentUser: Player = players[0];
export const currentTeam: Team = teams[0];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications: Notification[] = [
  {
    id: 'n1', type: 'challenge', read: false,
    title: 'Challenge received!',
    body: 'Pangrati Panthers want to face Kolonaki Kings in a 5v5 match.',
    time: '2h ago', avatarEmoji: '🐆', avatarColor: '#4E342E', teamId: 't7',
  },
  {
    id: 'n2', type: 'result_confirmed', read: false,
    title: 'Result confirmed ✅',
    body: 'Kolonaki Kings 3 – 1 Piraeus Pirates. Match result agreed by both teams.',
    time: '1d ago', avatarEmoji: '✅', avatarColor: '#2E7D32', matchId: 'm1',
  },
  {
    id: 'n3', type: 'scheduling', read: false,
    title: 'New time slot proposed',
    body: 'Piraeus Pirates propose 7 Mar @ 18:30 – Piraeus Municipal Field.',
    time: '3h ago', avatarEmoji: '⚡', avatarColor: '#1565C0', matchId: 'm4',
  },
  {
    id: 'n4', type: 'spot_applied', read: true,
    title: 'Player applied for open spot',
    body: 'Spyros Athanasiou (FWD) applied to join Kolonaki Kings.',
    time: '1d ago', avatarEmoji: '🏃', avatarColor: '#00695C',
  },
  {
    id: 'n5', type: 'bet_reminder', read: true,
    title: 'Bet reminder ☕',
    body: "Don't forget: Piraeus Pirates owe souvlaki for the whole team!",
    time: '2d ago', avatarEmoji: '🍖', avatarColor: '#E65100', matchId: 'm1',
  },
  {
    id: 'n6', type: 'match_reminder', read: true,
    title: 'Match in 2 days!',
    body: 'Kolonaki Kings vs Kifisia FC — 1 Mar @ 18:00, SEGAS Indoor.',
    time: '2d ago', avatarEmoji: '⚽', avatarColor: '#2E7D32', matchId: 'm3',
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const getTeamById = (id: string) => teams.find(t => t.id === id);
export const getPlayerById = (id: string) => players.find(p => p.id === id);
export const getMatchById = (id: string) => matches.find(m => m.id === id);
export const getTeamRecord = (team: Team) => `${team.record.w}W ${team.record.d}D ${team.record.l}L`;

export const getMatchResult = (match: Match, teamId: string): 'win' | 'loss' | 'draw' | null => {
  if (!match.score) return null;
  const isHome = match.homeTeamId === teamId;
  const myScore = isHome ? match.score.home : match.score.away;
  const theirScore = isHome ? match.score.away : match.score.home;
  if (myScore > theirScore) return 'win';
  if (myScore < theirScore) return 'loss';
  return 'draw';
};

export const formatScore = (match: Match): string => {
  if (!match.score) return '— : —';
  return `${match.score.home} – ${match.score.away}`;
};

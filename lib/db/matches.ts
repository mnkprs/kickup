import { createClient } from "@/lib/supabase/server";
import type { Match, MatchTournament, Team } from "@/lib/types";

// DB match statuses that map to "upcoming" in the UI
const UPCOMING_STATUSES = ["pending_challenge", "scheduling", "pre_match"];

function mapStatus(dbStatus: string): Match["status"] {
  if (dbStatus === "completed") return "completed";
  if (UPCOMING_STATUSES.includes(dbStatus)) return "upcoming";
  return dbStatus as Match["status"];
}

function mapTeam(row: Record<string, unknown>): Team {
  return {
    id: row.id as string,
    name: row.name as string,
    short_name: row.short_name as string,
    area: row.area as string,
    format: row.format as string,
    emoji: (row.emoji as string) ?? "⚽",
    color: (row.color as string) ?? "#2E7D32",
    avatar_url: row.avatar_url as string | null,
    description: (row.description as string) ?? "",
    open_spots: (row.open_spots as number) ?? 0,
    wins: (row.record_w as number) ?? 0,
    draws: (row.record_d as number) ?? 0,
    losses: (row.record_l as number) ?? 0,
    goals_for: (row.record_gf as number) ?? 0,
    goals_against: (row.record_ga as number) ?? 0,
    points: (row.points as number) ?? 0,
    captain_id: row.captain_id as string | null,
    home_ground: row.home_ground as string | null,
    searching_for_opponent: (row.searching_for_opponent as boolean) ?? false,
    created_at: row.created_at as string,
  };
}

function mapMatch(
  row: Record<string, unknown>,
  tournament?: MatchTournament | null
): Match {
  const homeTeamRow = row.home_team as Record<string, unknown>;
  const awayTeamRow = row.away_team as Record<string, unknown>;
  const dbStatus = row.status as string;

  return {
    id: row.id as string,
    home_team_id: row.home_team_id as string,
    away_team_id: row.away_team_id as string,
    home_team: mapTeam(homeTeamRow),
    away_team: mapTeam(awayTeamRow),
    format: row.format as string,
    status: mapStatus(dbStatus),
    raw_status: dbStatus,
    date: row.match_date as string | null,
    time: row.match_time as string | null,
    location: row.location as string | null,
    home_score: row.home_score as number | null,
    away_score: row.away_score as number | null,
    created_at: row.created_at as string,
    home_result_status: row.home_result_status as string | undefined,
    away_result_status: row.away_result_status as string | undefined,
    tournament: tournament ?? null,
  };
}

/** Fetch tournament info for matches that belong to a registered tournament */
export async function getTournamentsForMatches(
  matchIds: string[]
): Promise<Map<string, MatchTournament>> {
  if (matchIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournament_matches")
    .select("match_id, tournaments(id, name)")
    .in("match_id", matchIds);

  const map = new Map<string, MatchTournament>();
  const rows = (data ?? []) as unknown as {
    match_id: string;
    tournaments: { id: string; name: string } | { id: string; name: string }[] | null;
  }[];
  for (const row of rows) {
    const t = Array.isArray(row.tournaments) ? row.tournaments[0] : row.tournaments;
    if (t?.id && t?.name) {
      map.set(row.match_id, { id: t.id, name: t.name });
    }
  }
  return map;
}

const MATCH_SELECT = `
  *,
  home_team:teams!home_team_id(*),
  away_team:teams!away_team_id(*)
`;

export async function getMatch(id: string): Promise<Match | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  const tournamentMap = await getTournamentsForMatches([id]);
  const tournament = tournamentMap.get(id) ?? null;
  return mapMatch(data as Record<string, unknown>, tournament);
}

export async function getMatchesForTeam(teamId: string): Promise<Match[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("match_date", { ascending: false });

  if (error || !data) return [];
  const rows = data as Record<string, unknown>[];
  const tournamentMap = await getTournamentsForMatches(rows.map((r) => r.id as string));
  return rows.map((r) => mapMatch(r, tournamentMap.get(r.id as string) ?? null));
}

export async function getUpcomingMatches(teamId?: string | null): Promise<Match[]> {
  const supabase = await createClient();
  let query = supabase
    .from("matches")
    .select(MATCH_SELECT)
    .in("status", UPCOMING_STATUSES)
    .order("match_date", { ascending: true });

  if (teamId) {
    query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
  }

  const { data, error } = await query.limit(5);
  if (error || !data) return [];
  const rows = data as Record<string, unknown>[];
  const tournamentMap = await getTournamentsForMatches(rows.map((r) => r.id as string));
  return rows.map((r) => mapMatch(r, tournamentMap.get(r.id as string) ?? null));
}

export async function getRecentResults(teamId?: string | null): Promise<Match[]> {
  const supabase = await createClient();
  let query = supabase
    .from("matches")
    .select(MATCH_SELECT)
    .eq("status", "completed")
    .order("match_date", { ascending: false });

  if (teamId) {
    query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`);
  }

  const { data, error } = await query.limit(10);
  if (error || !data) return [];
  const rows = data as Record<string, unknown>[];
  const tournamentMap = await getTournamentsForMatches(rows.map((r) => r.id as string));
  return rows.map((r) => mapMatch(r, tournamentMap.get(r.id as string) ?? null));
}

/** Goals per player (scorer_id) for a specific match */
export async function getMatchGoalsByPlayer(matchId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("match_events")
    .select("scorer_id")
    .eq("match_id", matchId);

  const map = new Map<string, number>();
  for (const row of (data ?? []) as { scorer_id: string }[]) {
    map.set(row.scorer_id, (map.get(row.scorer_id) ?? 0) + 1);
  }
  return map;
}

/** Roster for a team in a match: from match_lineups if available, else team_members */
export async function getMatchRoster(
  matchId: string,
  teamId: string
): Promise<{ player_id: string; profile: Record<string, unknown> }[]> {
  const supabase = await createClient();

  const { data: lineupData } = await supabase
    .from("match_lineups")
    .select("player_id")
    .eq("match_id", matchId)
    .eq("team_id", teamId);

  if (lineupData && lineupData.length > 0) {
    const playerIds = (lineupData as { player_id: string }[]).map((r) => r.player_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_initials, avatar_color, avatar_url, position")
      .in("id", playerIds);

    if (!profiles) return [];
    return (profiles as Record<string, unknown>[]).map((p) => ({
      player_id: p.id as string,
      profile: p,
    }));
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("player_id, profiles(id, full_name, avatar_initials, avatar_color, avatar_url, position)")
    .eq("team_id", teamId)
    .eq("status", "active");

  if (!members) return [];
  return (members as Record<string, unknown>[])
    .filter((row) => row.profiles)
    .map((row) => ({
      player_id: row.player_id as string,
      profile: (row.profiles as Record<string, unknown>) ?? {},
    }));
}

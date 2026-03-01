import { createClient } from "@/lib/supabase/server";
import type { Match, Team } from "@/lib/types";

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
    created_at: row.created_at as string,
  };
}

function mapMatch(row: Record<string, unknown>): Match {
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
  };
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
  return mapMatch(data as Record<string, unknown>);
}

export async function getMatchesForTeam(teamId: string): Promise<Match[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(MATCH_SELECT)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("match_date", { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapMatch);
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
  return (data as Record<string, unknown>[]).map(mapMatch);
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
  return (data as Record<string, unknown>[]).map(mapMatch);
}

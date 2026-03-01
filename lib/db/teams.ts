import { createClient } from "@/lib/supabase/server";
import type { Team, Profile, TeamMember } from "@/lib/types";

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

function mapMemberProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    full_name: row.full_name as string,
    avatar_initials: row.avatar_initials as string,
    avatar_color: row.avatar_color as string,
    avatar_url: row.avatar_url as string | null,
    position: row.position as string | null,
    area: row.area as string | null,
    bio: (row.bio as string) ?? "",
    is_freelancer: (row.is_freelancer as boolean) ?? false,
    is_field_owner: (row.is_field_owner as boolean) ?? false,
    is_admin: (row.is_admin as boolean) ?? false,
    matches_played: (row.stat_matches as number) ?? 0,
    goals: (row.stat_goals as number) ?? 0,
    assists: (row.stat_assists as number) ?? 0,
    wins: (row.stat_wins as number) ?? 0,
    draws: (row.stat_draws as number) ?? 0,
    losses: (row.stat_losses as number) ?? 0,
    man_of_match: (row.stat_mvp as number) ?? 0,
    yellow_cards: (row.stat_yellow_cards as number) ?? 0,
    red_cards: (row.stat_red_cards as number) ?? 0,
    clean_sheets: (row.stat_clean_sheets as number) ?? 0,
    team_id: null,
    joined_date: row.created_at as string,
    created_at: row.created_at as string,
  };
}

export async function getTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("points", { ascending: false });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTeam);
}

export async function getTeam(id: string): Promise<Team | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapTeam(data as Record<string, unknown>);
}

export async function getUserTeam(userId: string): Promise<Team | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("teams(*)")
    .eq("player_id", userId)
    .single();

  if (error || !data) return null;
  const teamData = (data as Record<string, unknown>).teams;
  if (!teamData) return null;
  return mapTeam(teamData as Record<string, unknown>);
}

export async function getTeamMembers(
  teamId: string
): Promise<(TeamMember & { profile: Profile })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*, profiles(*)")
    .eq("team_id", teamId)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const profileRow = row.profiles as Record<string, unknown>;
    return {
      id: row.id as string,
      team_id: row.team_id as string,
      player_id: row.player_id as string,
      role: row.role as "captain" | "player",
      joined_at: row.joined_at as string,
      profile: mapMemberProfile(profileRow),
    };
  });
}

import { createClient } from "@/lib/supabase/server";
import type { Profile, OwnerApplication, TopScorer } from "@/lib/types";

function mapProfile(row: Record<string, unknown>): Profile {
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
    team_id: null, // resolved separately via team_members
    joined_date: row.created_at as string,
    created_at: row.created_at as string,
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const profile = mapProfile(data as Record<string, unknown>);

  // Resolve team_id from team_members
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("player_id", userId)
    .single();

  if (membership) {
    profile.team_id = membership.team_id as string;
  }

  return profile;
}

export async function updateProfile(
  userId: string,
  data: { full_name?: string; position?: string; area?: string; bio?: string }
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select("*")
    .single();

  if (error || !updated) return null;
  return mapProfile(updated as Record<string, unknown>);
}

export async function getTopScorers(limit = 5): Promise<TopScorer[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*, team_members(team_id, teams(short_name))")
    .gt("stat_goals", 0)
    .order("stat_goals", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return (data as Record<string, unknown>[]).map((p) => {
    const memberships = p.team_members as Record<string, unknown>[];
    const teamShortName =
      ((memberships?.[0]?.teams as Record<string, unknown>)?.short_name as string) ?? "—";
    return {
      player: mapProfile(p),
      team_short_name: teamShortName,
      goals: (p.stat_goals as number) ?? 0,
      assists: (p.stat_assists as number) ?? 0,
    };
  });
}

export async function applyForFieldOwner(
  userId: string,
  message: string
): Promise<OwnerApplication | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owner_applications")
    .upsert({ user_id: userId, message, status: "pending" }, { onConflict: "user_id" })
    .select()
    .single();

  if (error || !data) return null;
  return data as unknown as OwnerApplication;
}

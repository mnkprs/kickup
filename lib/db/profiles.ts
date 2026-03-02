import { createClient } from "@/lib/supabase/server";
import type { Profile, OwnerApplication, TopScorer, Notification } from "@/lib/types";

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    full_name: row.full_name as string,
    avatar_initials: row.avatar_initials as string,
    avatar_color: row.avatar_color as string,
    avatar_url: row.avatar_url as string | null,
    position: row.position as string | null,
    area: row.area as string | null,
    nationality: (row.nationality as string) ?? null,
    date_of_birth: (row.date_of_birth as string) ?? null,
    height: (row.height as number) ?? null,
    preferred_foot: (row.preferred_foot as string) ?? null,
    bio: (row.bio as string) ?? "",
    is_freelancer: (row.is_freelancer as boolean) ?? false,
    freelancer_until: (row.freelancer_until as string) ?? null,
    is_field_owner: (row.is_field_owner as boolean) ?? false,
    is_admin: (row.is_admin as boolean) ?? false,
    matches_played: (row.stat_matches as number) ?? 0,
    goals: (row.stat_goals as number) ?? 0,
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
    preferred_theme: (row.preferred_theme as "light" | "dark") ?? "dark",
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

  // Resolve team_id from team_members (prefer captain role, active only)
  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("player_id", userId)
    .eq("status", "active")
    .order("role", { ascending: true }); // captain < player, so captain first

  if (memberships && memberships.length > 0) {
    profile.team_id = memberships[0].team_id as string;
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
    };
  });
}

export async function getFreelancers(): Promise<Profile[]> {
  const supabase = await createClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const pastNoon = now.getHours() >= 12;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_freelancer", true)
    .or(`freelancer_until.is.null,freelancer_until.gte.${today}`)
    .order("full_name", { ascending: true });

  if (error || !data) return [];

  const profiles = (data as Record<string, unknown>[]).map((row) => mapProfile(row));

  // Default: flag turns off at 12pm same day. Exclude if freelancer_until is today and it's past noon.
  return profiles.filter((p) => {
    const until = p.freelancer_until;
    if (!until) return true;
    if (until > today) return true;
    if (until === today && pastNoon) return false;
    return true;
  });
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []) as Notification[];
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

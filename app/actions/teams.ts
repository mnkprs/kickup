"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTeamAction(data: {
  name: string;
  short_name: string;
  area: string;
  format: string;
  description?: string;
  emoji?: string;
  color?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      name: data.name,
      short_name: data.short_name,
      area: data.area,
      format: data.format,
      description: data.description ?? "",
      emoji: data.emoji ?? "⚽",
      color: data.color ?? "#2E7D32",
      captain_id: user.id,
    })
    .select("id")
    .single();

  if (error || !team) return { error: error?.message ?? "Failed to create team" };

  // Auto-join as captain
  await supabase.from("team_members").insert({
    team_id: team.id,
    player_id: user.id,
    role: "captain",
  });

  revalidatePath("/teams");
  return { success: true, teamId: team.id };
}

export async function joinTeamAction(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Check not already a member
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("player_id", user.id)
    .maybeSingle();

  if (existing) return { error: "Already a member" };

  const { error } = await supabase.from("team_members").insert({
    team_id: teamId,
    player_id: user.id,
    role: "player",
  });

  if (error) return { error: error.message };

  revalidatePath("/teams");
  return { success: true };
}

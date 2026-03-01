"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTeamAction(data: {
  name: string;
  formats: string[];
  area: string;
  emoji: string;
  color: string;
  description: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const shortName = data.name.trim().slice(0, 3).toUpperCase();

  const { data: teamId, error } = await supabase.rpc("create_team_with_captain", {
    p_name: data.name.trim(),
    p_short_name: shortName,
    p_formats: data.formats,
    p_area: data.area,
    p_emoji: data.emoji,
    p_color: data.color,
    p_description: data.description,
  });

  if (error) return { error: error.message };

  revalidatePath("/teams");
  return { teamId: teamId as string };
}

export async function joinTeamAction(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

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

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function setTeamSearchingForPlayersAction(teamId: string, value: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("set_team_searching_for_players", {
    p_team_id: teamId,
    p_value: value,
  });
  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/find-players");
  return { success: true };
}

export async function toggleSearchingForOpponentAction(teamId: string, value: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("teams")
    .update({ searching_for_opponent: value })
    .eq("id", teamId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
  return { success: true };
}

export async function joinTeamAction(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("apply_to_team", { p_team_id: teamId });
  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function approveJoinRequestAction(teamId: string, playerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_team_member", {
    p_team_id: teamId,
    p_player_id: playerId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function rejectJoinRequestAction(teamId: string, playerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("player_id", playerId)
    .eq("status", "pending");
  if (error) return { error: error.message };
  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function invitePlayerToTeamAction(playerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("invite_player_to_team", {
    p_player_id: playerId,
  });
  if (error) return { error: error.message };

  revalidatePath("/find-players");
  return { success: true };
}

export async function leaveTeamAction(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("leave_team", { p_team_id: teamId });
  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
  revalidatePath("/");
  revalidatePath("/profile");
  redirect("/teams");
}

export async function removeMemberAction(teamId: string, playerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_team_member", {
    p_team_id: teamId,
    p_player_id: playerId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function assignTeamCaptainAction(teamId: string, playerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_team_captain", {
    p_team_id: teamId,
    p_player_id: playerId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
  revalidatePath("/");
  return { success: true };
}

export async function updateTeamAvatarUrlAction(teamId: string, avatarUrl: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify user is team captain
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("player_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership || membership.role !== "captain") {
    return { error: "Only team captains can update the team avatar" };
  }

  const { error } = await supabase
    .from("teams")
    .update({ avatar_url: avatarUrl })
    .eq("id", teamId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTeamAction(teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) return { error: error.message };

  revalidatePath("/teams");
  redirect("/teams");
}

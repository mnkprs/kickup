"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendChallengeAction(data: {
  homeTeamId: string;
  awayTeamId: string;
  format: string;
  message: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: matchId, error } = await supabase.rpc("send_challenge", {
    p_home_team_id: data.homeTeamId,
    p_away_team_id: data.awayTeamId,
    p_format: data.format,
    p_message: data.message || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/matches");
  return { matchId: matchId as string };
}

export async function acceptChallengeAction(matchId: string, teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("accept_challenge", {
    p_match_id: matchId,
    p_team_id: teamId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  return { success: true };
}

export async function declineChallengeAction(matchId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .eq("status", "pending_challenge");

  if (error) return { error: error.message };

  revalidatePath("/matches");
  return { success: true };
}

export async function setMatchTimeAction(data: {
  matchId: string;
  date: string;
  time: string;
  location: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("matches")
    .update({
      match_date: data.date,
      match_time: data.time || null,
      location: data.location || null,
      status: "pre_match",
    })
    .eq("id", data.matchId)
    .eq("status", "scheduling");

  if (error) return { error: error.message };

  revalidatePath(`/matches/${data.matchId}`);
  revalidatePath("/matches");
  return { success: true };
}

export async function submitResultAction(data: {
  matchId: string;
  teamId: string;
  homeScore: number;
  awayScore: number;
  mvpId: string | null;
  notes: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("submit_result", {
    p_match_id: data.matchId,
    p_team_id: data.teamId,
    p_home_score: data.homeScore,
    p_away_score: data.awayScore,
    p_mvp_id: data.mvpId,
    p_notes: data.notes || null,
    p_events: [],
  });

  if (error) return { error: error.message };

  revalidatePath(`/matches/${data.matchId}`);
  revalidatePath("/matches");
  revalidatePath("/");
  return { success: true };
}

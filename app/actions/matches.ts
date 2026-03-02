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

  const { data: match, error } = await supabase.rpc("send_challenge", {
    p_home_team_id: data.homeTeamId,
    p_away_team_id: data.awayTeamId,
    p_format: data.format,
    p_message: data.message || null,
  });

  if (error) return { error: error.message };

  // RPC returns the full match row; extract id for redirect
  const matchId =
    typeof match === "object" && match !== null && "id" in match
      ? (match as { id: string }).id
      : match;

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

/** Captains propose date/time/location; opponent must accept for it to become final. */
export async function proposeMatchTimeAction(data: {
  matchId: string;
  teamId: string;
  date: string;
  time: string;
  location: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const timeValue = data.time.trim() ? `${data.time.trim().padStart(5, "0")}:00` : "12:00:00";

  const { error } = await supabase.rpc("propose_match_time", {
    p_match_id: data.matchId,
    p_team_id: data.teamId,
    p_proposed_date: data.date,
    p_proposed_time: timeValue,
    p_location: data.location.trim() || "TBD",
  });

  if (error) return { error: error.message };

  revalidatePath(`/matches/${data.matchId}`);
  revalidatePath("/matches");
  return { success: true };
}

/** Opponent captain accepts a proposal; it becomes the final schedule. */
export async function acceptProposalAction(
  proposalId: string,
  teamId: string,
  matchId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("accept_proposal", {
    p_proposal_id: proposalId,
    p_team_id: teamId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/matches/${matchId}`);
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
  goals?: Record<string, number>;
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
    p_goals: data.goals ?? {},
  });

  if (error) return { error: error.message };

  const { data: tm } = await supabase
    .from("tournament_matches")
    .select("tournament_id")
    .eq("match_id", data.matchId)
    .maybeSingle();
  if (tm) revalidatePath(`/tournaments/${(tm as { tournament_id: string }).tournament_id}`);

  revalidatePath(`/matches/${data.matchId}`);
  revalidatePath("/matches");
  revalidatePath("/");
  return { success: true };
}

export async function organizerSubmitResultAction(data: {
  matchId: string;
  homeScore: number;
  awayScore: number;
  mvpId: string | null;
  notes: string;
  goals?: { home?: Record<string, number>; away?: Record<string, number> };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("organizer_submit_result", {
    p_match_id: data.matchId,
    p_home_score: data.homeScore,
    p_away_score: data.awayScore,
    p_mvp_id: data.mvpId,
    p_notes: data.notes || null,
    p_goals: data.goals ?? { home: {}, away: {} },
  });

  if (error) return { error: error.message };

  const { data: tm } = await supabase
    .from("tournament_matches")
    .select("tournament_id")
    .eq("match_id", data.matchId)
    .maybeSingle();
  if (tm) revalidatePath(`/tournaments/${(tm as { tournament_id: string }).tournament_id}`);

  revalidatePath(`/matches/${data.matchId}`);
  revalidatePath("/matches");
  revalidatePath("/");
  return { success: true };
}

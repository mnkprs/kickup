"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function removeTeamFromTournamentAction(tournamentId: string, teamId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_team_from_tournament", {
    p_tournament_id: tournamentId,
    p_team_id: teamId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  return { success: true };
}

export async function withdrawFromTournamentAction(tournamentId: string, teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.rpc("withdraw_from_tournament", {
    p_tournament_id: tournamentId,
    p_team_id: teamId,
  });
  if (error) return { error: error.message };

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  return { success: true };
}

export async function registerForTournamentAction(tournamentId: string, teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("organizer_id")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) return { error: "Tournament not found" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isOrganizer = tournament.organizer_id === user.id;
  const isAdmin = profile?.is_admin === true;
  const status = isOrganizer || isAdmin ? "approved" : "pending";

  const { error } = await supabase
    .from("tournament_registrations")
    .upsert(
      { tournament_id: tournamentId, team_id: teamId, status },
      { onConflict: "tournament_id,team_id" }
    );

  if (error) return { error: error.message };

  if (status === "pending") {
    await supabase.rpc("notify_organizer_tournament_application", {
      p_tournament_id: tournamentId,
      p_team_id: teamId,
    });
  }

  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true, status };
}

export async function createTournamentAction(data: {
  name: string;
  description: string;
  match_format: string;
  max_teams: number;
  bracket_format?: string;
  teams_per_group?: number;
  knockout_mode?: "auto" | "custom";
  venue: string;
  area: string;
  start_date: string;
  end_date: string;
  prize: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: inserted, error } = await supabase
    .from("tournaments")
    .insert({
      name: data.name.trim(),
      description: data.description.trim(),
      match_format: data.match_format,
      max_teams: data.max_teams,
      bracket_format: data.bracket_format ?? "group_stage",
      teams_per_group: data.teams_per_group ?? 4,
      knockout_mode: data.knockout_mode ?? "auto",
      venue: data.venue.trim(),
      area: data.area,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      prize: data.prize.trim(),
      organizer_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/tournaments");
  return { tournamentId: (inserted as { id: string }).id };
}

export async function approveTournamentRegistrationAction(
  registrationId: string,
  tournamentId?: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_tournament_registration", {
    p_registration_id: registrationId,
  });
  if (error) return { error: error.message };
  const reg = data as { tournament_id: string } | null;
  const id = tournamentId ?? reg?.tournament_id;
  if (id) revalidatePath(`/tournaments/${id}`);
  return { success: true };
}

export async function rejectTournamentRegistrationAction(
  registrationId: string,
  tournamentId?: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reject_tournament_registration", {
    p_registration_id: registrationId,
  });
  if (error) return { error: error.message };
  const reg = data as { tournament_id: string } | null;
  const id = tournamentId ?? reg?.tournament_id;
  if (id) revalidatePath(`/tournaments/${id}`);
  return { success: true };
}

export async function startGroupStageAction(tournamentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_group_stage", {
    p_tournament_id: tournamentId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}

export async function advanceToKnockoutsAction(tournamentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_to_knockouts", {
    p_tournament_id: tournamentId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}

export async function advanceToFinalAction(tournamentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("advance_to_final", {
    p_tournament_id: tournamentId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}

export async function createKnockoutMatchAction(data: {
  tournamentId: string;
  stage: string;
  roundOrder: number;
  homeTeamId: string;
  awayTeamId: string;
}) {
  const supabase = await createClient();
  const { data: matchId, error } = await supabase.rpc("create_knockout_match", {
    p_tournament_id: data.tournamentId,
    p_stage: data.stage,
    p_round_order: data.roundOrder,
    p_home_team_id: data.homeTeamId,
    p_away_team_id: data.awayTeamId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/tournaments/${data.tournamentId}`);
  return { success: true, matchId };
}

export async function assignTeamsToMatchAction(data: {
  matchId: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("assign_teams_to_tournament_match", {
    p_match_id: data.matchId,
    p_home_team_id: data.homeTeamId,
    p_away_team_id: data.awayTeamId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/tournaments/${data.tournamentId}`);
  return { success: true };
}

export async function completeTournamentAction(tournamentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_tournament", {
    p_tournament_id: tournamentId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}

export async function setTournamentMatchScheduleAction(data: {
  matchId: string;
  tournamentId: string;
  date: string;
  time: string;
  location?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_tournament_match_schedule", {
    p_match_id: data.matchId,
    p_date: data.date,
    p_time: data.time || null,
    p_location: data.location?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/tournaments/${data.tournamentId}`);
  revalidatePath(`/tournaments`);
  return { success: true };
}

export async function updateTournamentAction(
  tournamentId: string,
  data: {
    name: string;
    description: string;
    match_format: string;
    max_teams: number;
    bracket_format?: string;
    teams_per_group?: number;
    knockout_mode?: "auto" | "custom";
    venue: string;
    area: string;
    start_date: string;
    end_date: string;
    prize: string;
  }
) {
  const supabase = await createClient();
  const update: Record<string, unknown> = {
    name: data.name.trim(),
    description: data.description.trim(),
    match_format: data.match_format,
    max_teams: data.max_teams,
    venue: data.venue.trim(),
    area: data.area,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    prize: data.prize.trim(),
  };
  if (data.bracket_format != null) update.bracket_format = data.bracket_format;
  if (data.teams_per_group != null) update.teams_per_group = data.teams_per_group;
  if (data.knockout_mode != null) update.knockout_mode = data.knockout_mode;
  const { error } = await supabase
    .from("tournaments")
    .update(update)
    .eq("id", tournamentId);

  if (error) return { error: error.message };

  revalidatePath(`/tournaments/${tournamentId}`);
  revalidatePath("/tournaments");
  return { success: true };
}

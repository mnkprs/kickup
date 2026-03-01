"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registerForTournamentAction(tournamentId: string, teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("tournament_registrations")
    .upsert(
      { tournament_id: tournamentId, team_id: teamId, status: "pending" },
      { onConflict: "tournament_id,team_id" }
    );

  if (error) return { error: error.message };

  revalidatePath(`/tournaments/${tournamentId}`);
  return { success: true };
}

export async function createTournamentAction(data: {
  name: string;
  description: string;
  match_format: string;
  max_teams: number;
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

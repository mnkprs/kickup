"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitResultAction(
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("matches")
    .update({ home_score: homeScore, away_score: awayScore, status: "completed" })
    .eq("id", matchId);

  if (error) return { error: error.message };

  revalidatePath("/matches");
  revalidatePath("/");
  return { success: true };
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/db/profiles";
import { CreateTournamentForm } from "@/components/create-tournament-form";

export default async function CreateTournamentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profile, { data: areasData }] = await Promise.all([
    getProfile(user.id),
    supabase.from("areas").select("name, city").order("city").order("sort"),
  ]);

  if (!profile || !profile.is_field_owner) redirect("/tournaments");

  const cityMap: Record<string, string[]> = {};
  for (const row of areasData ?? []) {
    if (!cityMap[row.city]) cityMap[row.city] = [];
    cityMap[row.city].push(row.name);
  }
  const areaGroups = Object.entries(cityMap).map(([city, areas]) => ({ city, areas }));

  return <CreateTournamentForm areaGroups={areaGroups} />;
}

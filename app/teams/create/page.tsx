import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateTeamForm } from "@/components/create-team-form";

export default async function CreateTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: areasData }, { data: emojisData }, { data: colorsData }] =
    await Promise.all([
      supabase.from("areas").select("name, city").order("city").order("sort"),
      supabase.from("team_emojis").select("emoji").order("sort"),
      supabase.from("avatar_colors").select("hex").order("sort"),
    ]);

  const cityMap: Record<string, string[]> = {};
  for (const row of areasData ?? []) {
    if (!cityMap[row.city]) cityMap[row.city] = [];
    cityMap[row.city].push(row.name);
  }
  const areaGroups = Object.entries(cityMap).map(([city, areas]) => ({
    city,
    areas: [...areas].sort((a, b) => a.localeCompare(b)),
  }));

  const emojis = (emojisData ?? []).map((r) => r.emoji);
  const colors = (colorsData ?? []).map((r) => r.hex);

  return <CreateTeamForm areaGroups={areaGroups} emojis={emojis} colors={colors} />;
}

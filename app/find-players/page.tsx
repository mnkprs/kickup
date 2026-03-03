import { createClient } from "@/lib/supabase/server";
import { getAllPlayers } from "@/lib/db/profiles";
import { getCaptainTeam } from "@/lib/db/teams";
import { FindPlayersClient } from "@/components/find-players/find-players-client";
import type { AreaGroup } from "@/lib/types";

export default async function FindPlayersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: areasData }, players, captainTeam] = await Promise.all([
    supabase.from("areas").select("name, city").order("city").order("sort"),
    getAllPlayers(),
    user ? getCaptainTeam(user.id) : null,
  ]);

  const cityMap: Record<string, string[]> = {};
  for (const row of areasData ?? []) {
    if (!cityMap[row.city]) cityMap[row.city] = [];
    cityMap[row.city].push(row.name);
  }
  const areaGroups: AreaGroup[] = Object.entries(cityMap).map(([city, areas]) => ({
    city,
    areas: [...areas].sort((a, b) => a.localeCompare(b)),
  }));

  return (
    <FindPlayersClient
      players={players}
      captainTeamId={captainTeam?.id ?? null}
      currentUserId={user?.id ?? null}
      areaGroups={areaGroups}
    />
  );
}

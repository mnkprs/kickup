import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profiles";
import { getUpcomingMatches, getRecentResults } from "@/lib/db/matches";
import { MatchesPageClient } from "@/components/matches-page-client";
import type { AreaGroup } from "@/lib/types";

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user.id) : null;
  const teamId = profile?.team_id ?? null;

  const [{ data: areasData }, upcomingMatches, recentResults] = await Promise.all([
    supabase.from("areas").select("name, city").order("city").order("sort"),
    getUpcomingMatches(null),
    getRecentResults(null),
  ]);

  const cityMap: Record<string, string[]> = {};
  for (const row of areasData ?? []) {
    if (!cityMap[row.city]) cityMap[row.city] = [];
    cityMap[row.city].push(row.name);
  }
  const areaGroups: AreaGroup[] = Object.entries(cityMap).map(([city, areas]) => ({
    city,
    areas,
  }));

  const [myUpcomingMatches, myRecentResults] = teamId
    ? await Promise.all([
        getUpcomingMatches(teamId),
        getRecentResults(teamId),
      ])
    : [null, null];

  return (
    <Suspense>
      <MatchesPageClient
        upcomingMatches={upcomingMatches}
        recentResults={recentResults}
        myUpcomingMatches={myUpcomingMatches}
        myRecentResults={myRecentResults}
        teamId={teamId}
        areaGroups={areaGroups}
      />
    </Suspense>
  );
}

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profiles";
import { getUpcomingMatches, getRecentResults } from "@/lib/db/matches";
import { MatchesPageClient } from "@/components/matches-page-client";

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user.id) : null;
  const teamId = profile?.team_id ?? null;

  // Fetch all matches (global feed)
  const [upcomingMatches, recentResults] = await Promise.all([
    getUpcomingMatches(null),
    getRecentResults(null),
  ]);

  // When user has a team, also fetch team-filtered matches for "My team only" filter
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
      />
    </Suspense>
  );
}

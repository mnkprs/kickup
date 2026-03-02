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

  // Matches page shows all matches (global feed); teamId kept for highlighting user's team in results
  const [upcomingMatches, recentResults] = await Promise.all([
    getUpcomingMatches(null),
    getRecentResults(null),
  ]);

  return (
    <Suspense>
      <MatchesPageClient
        upcomingMatches={upcomingMatches}
        recentResults={recentResults}
        teamId={profile?.team_id ?? null}
      />
    </Suspense>
  );
}

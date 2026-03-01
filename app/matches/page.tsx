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

  const [upcomingMatches, recentResults] = await Promise.all([
    getUpcomingMatches(profile?.team_id),
    getRecentResults(profile?.team_id),
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

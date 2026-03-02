import { createClient } from "@/lib/supabase/server";
import { getProfile, getTopScorers, getNotifications } from "@/lib/db/profiles";
import { getUpcomingMatches, getRecentResults } from "@/lib/db/matches";
import { getTeams } from "@/lib/db/teams";
import { getTournaments } from "@/lib/db/tournaments";
import { DashboardHeader } from "@/components/dashboard-header";
import { QuickStats } from "@/components/quick-stats";
import { UpcomingMatches } from "@/components/upcoming-matches";
import { MyForm } from "@/components/my-form";
import { RecentResults } from "@/components/recent-results";
import { TopScorers } from "@/components/top-scorers";
import { TournamentsBanner } from "@/components/tournaments-banner";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, tournaments, topScorers, notifications] = await Promise.all([
    user ? getProfile(user.id) : null,
    getTournaments(),
    getTopScorers(5),
    user ? getNotifications(user.id) : [],
  ]);

  const [upcomingMatches, recentResults] = await Promise.all([
    getUpcomingMatches(profile?.team_id),
    getRecentResults(profile?.team_id),
  ]);

  const teams = await getTeams();
  const userTeam = profile?.team_id
    ? teams.find((t) => t.id === profile.team_id) ?? null
    : null;

  return (
    <>
      <DashboardHeader profile={profile} upcomingMatches={upcomingMatches} recentResults={recentResults} notifications={notifications} />

      <main className="flex flex-col gap-6 pb-24">
        {profile && <QuickStats profile={profile} />}
        <UpcomingMatches matches={upcomingMatches} />
        {userTeam && <MyForm matches={recentResults} team={userTeam} />}
        <RecentResults matches={recentResults} teamId={profile?.team_id} />
        <TopScorers scorers={topScorers} />
        <TournamentsBanner tournaments={tournaments} />
      </main>
    </>
  );
}

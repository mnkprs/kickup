import { createClient } from "@/lib/supabase/server";
import { getProfile, getNotifications, getLookingForTeamCount } from "@/lib/db/profiles";
import { getUpcomingMatches, getRecentResults } from "@/lib/db/matches";
import { getTeams } from "@/lib/db/teams";
import { getTournaments } from "@/lib/db/tournaments";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { QuickStats } from "@/components/layout/quick-stats";
import { UpcomingMatches } from "@/components/ui/upcoming-matches";
import { MyForm } from "@/components/matches/my-form";
import { RecentResults } from "@/components/ui/recent-results";
import { TournamentsBanner } from "@/components/tournaments/tournaments-banner";
import { FindPlayersBanner } from "@/components/find-players/find-players-banner";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, tournaments, notifications, lookingForTeamCount] = await Promise.all([
    user ? getProfile(user.id) : null,
    getTournaments(),
    user ? getNotifications(user.id) : [],
    getLookingForTeamCount(),
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

      <main className="dashboard-page__main flex flex-col gap-6 pb-24">
        {profile && <QuickStats profile={profile} />}
        <FindPlayersBanner lookingForTeamCount={lookingForTeamCount} />
        <UpcomingMatches matches={upcomingMatches} />
        {userTeam && <MyForm matches={recentResults} team={userTeam} />}
        <RecentResults matches={recentResults} teamId={profile?.team_id} seeAllHref="/matches?tab=Results" />
        <TournamentsBanner tournaments={tournaments} userTeamId={profile?.team_id ?? null} />
      </main>
    </>
  );
}

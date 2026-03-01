import { DashboardHeader } from "@/components/dashboard-header";
import { QuickStats } from "@/components/quick-stats";
import { UpcomingMatches } from "@/components/upcoming-matches";
import { MyForm } from "@/components/my-form";
import { RecentResults } from "@/components/recent-results";
import { LeagueStandings } from "@/components/league-standings";
import { TopScorers } from "@/components/top-scorers";
import { TournamentsBanner } from "@/components/tournaments-banner";
import { BottomNav } from "@/components/bottom-nav";

export default function DashboardPage() {
  return (
    <div className="min-h-dvh bg-background max-w-lg mx-auto relative">
      <DashboardHeader />

      <main className="flex flex-col gap-6 pb-24">
        <QuickStats />
        <UpcomingMatches />
        <MyForm />
        <RecentResults />
        <LeagueStandings />
        <TopScorers />
        <TournamentsBanner />
      </main>

      <BottomNav />
    </div>
  );
}

import { ProfileHeader } from "@/components/profile-header";
import { ProfileStats } from "@/components/profile-stats";
import { ProfilePerformanceChart } from "@/components/profile-performance-chart";
import { ProfileTeamCard } from "@/components/profile-team-card";
import { ProfileActivity } from "@/components/profile-activity";
import { ProfileAchievements } from "@/components/profile-achievements";
import { BottomNav } from "@/components/bottom-nav";

export default function ProfilePage() {
  return (
    <div className="min-h-dvh bg-background max-w-lg mx-auto relative">
      <ProfileHeader />

      <main className="flex flex-col gap-6 pb-24">
        <ProfileStats />
        <ProfilePerformanceChart />
        <ProfileTeamCard />
        <ProfileActivity />
        <ProfileAchievements />
      </main>

      <BottomNav />
    </div>
  );
}

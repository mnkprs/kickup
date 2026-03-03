import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profiles";
import { getUserTeam } from "@/lib/db/teams";
import { getMatchesForTeam } from "@/lib/db/matches";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileAbout } from "@/components/profile-about";
import { ProfileStats } from "@/components/profile-stats";
import { ProfileTeamCard } from "@/components/profile-team-card";
import { ProfileActivity } from "@/components/profile-activity";
import { ProfileAchievements } from "@/components/profile-achievements";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, team] = await Promise.all([
    getProfile(id),
    getUserTeam(id),
  ]);

  if (!profile) notFound();

  const matches = team ? await getMatchesForTeam(team.id) : [];

  return (
    <div className="player-profile-page">
      <ProfileHeader profile={profile} team={team} showSettings={false} />
      <main className="player-profile-page__main flex flex-col gap-5 pb-24 px-5">
        <ProfileAbout profile={profile} />
        <ProfileStats profile={profile} />
        <ProfileTeamCard
          profile={profile}
          team={team}
          showCaptainToggles={user?.id === id}
        />
        <ProfileActivity matches={matches} teamId={team?.id ?? null} />
        <ProfileAchievements profile={profile} />
      </main>
    </div>
  );
}

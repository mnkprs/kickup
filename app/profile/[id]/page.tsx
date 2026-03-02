import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profiles";
import { getUserTeam } from "@/lib/db/teams";
import { getMatchesForTeam } from "@/lib/db/matches";
import { ProfileHeader } from "@/components/profile-header";
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

  const [profile, team] = await Promise.all([
    getProfile(id),
    getUserTeam(id),
  ]);

  if (!profile) notFound();

  const matches = team ? await getMatchesForTeam(team.id) : [];

  return (
    <>
      <ProfileHeader profile={profile} team={team} showSettings={false} />
      <main className="flex flex-col gap-6 pb-24">
        <ProfileStats profile={profile} />
        <ProfileTeamCard profile={profile} team={team} />
        <ProfileActivity matches={matches} teamId={team?.id ?? null} />
        <ProfileAchievements profile={profile} />
      </main>
    </>
  );
}

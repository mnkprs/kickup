import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profiles";
import { isUnknownPlayer } from "@/lib/constants";
import { getUserTeam } from "@/lib/db/teams";
import { getMatchesForTeam } from "@/lib/db/matches";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileAbout } from "@/components/profile/profile-about";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileTeamCard } from "@/components/profile/profile-team-card";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { ProfileAchievements } from "@/components/profile/profile-achievements";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (isUnknownPlayer(id)) notFound();
  const profile = await getProfile(id);
  if (!profile) {
    return { title: "Player - Kickup" };
  }
  const title = `${profile.full_name} - Kickup Profile`;
  const description = profile.bio
    ? `${profile.bio.slice(0, 155)}${profile.bio.length > 155 ? "…" : ""}`
    : `View ${profile.full_name}'s football stats and achievements on Kickup`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (isUnknownPlayer(id)) notFound();

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

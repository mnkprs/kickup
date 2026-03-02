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
import { User, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

function GuestProfile() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 px-5 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <User size={28} className="text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-foreground font-semibold text-lg mb-1">Not signed in</h2>
        <p className="text-muted-foreground text-sm">Sign in to see your profile, stats and achievements.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none">
        <Link
          href="/auth/login"
          className="h-11 w-full sm:flex-1 rounded-xl bg-accent text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent-light transition-colors pressable"
        >
          <LogIn size={16} />
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="h-11 w-full sm:flex-1 rounded-xl bg-card border border-border font-medium text-sm flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors pressable"
        >
          <UserPlus size={16} />
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <GuestProfile />;

  const [profile, team] = await Promise.all([
    getProfile(user.id),
    getUserTeam(user.id),
  ]);

  if (!profile) return <GuestProfile />;

  const matches = team ? await getMatchesForTeam(team.id) : [];

  return (
    <>
      <ProfileHeader profile={profile} team={team} />

      <main className="flex flex-col gap-5 pb-24 px-5">
        <ProfileAbout profile={profile} />
        <ProfileStats profile={profile} />
        <ProfileTeamCard profile={profile} team={team} showCaptainToggles />
        <ProfileActivity matches={matches} teamId={team?.id ?? null} />
        <ProfileAchievements profile={profile} />
      </main>
    </>
  );
}

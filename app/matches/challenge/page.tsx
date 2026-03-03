import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTeams, getUserTeam } from "@/lib/db/teams";
import dynamic from "next/dynamic";

const SendChallengeForm = dynamic(
  () => import("@/components/matches/send-challenge-form").then((m) => ({ default: m.SendChallengeForm })),
);

export default async function SendChallengePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [userTeam, allTeams] = await Promise.all([
    getUserTeam(user.id),
    getTeams(),
  ]);

  if (!userTeam) redirect("/teams");

  const opponents = allTeams.filter((t) => t.id !== userTeam.id);

  return (
    <SendChallengeForm
      userTeam={userTeam}
      opponents={opponents}
    />
  );
}

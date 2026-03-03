import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getTeams, getUserTeam } from "@/lib/db/teams";
import { TeamsListClient } from "@/components/teams-list-client";

export default async function TeamsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [teams, userTeam] = await Promise.all([
    getTeams(),
    user ? getUserTeam(user.id) : null,
  ]);

  return (
    <Suspense fallback={<div className="h-32 animate-pulse bg-muted/30 rounded-xl mx-5" />}>
      <TeamsListClient teams={teams} userTeamId={userTeam?.id} />
    </Suspense>
  );
}

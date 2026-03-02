import { createClient } from "@/lib/supabase/server";
import { getFreelancers } from "@/lib/db/profiles";
import { getCaptainTeam } from "@/lib/db/teams";
import { FindPlayersClient } from "@/components/find-players-client";

export default async function FindPlayersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [freelancers, captainTeam] = await Promise.all([
    getFreelancers(),
    user ? getCaptainTeam(user.id) : null,
  ]);

  return (
    <FindPlayersClient
      freelancers={freelancers}
      captainTeamId={captainTeam?.id ?? null}
      currentUserId={user?.id ?? null}
    />
  );
}

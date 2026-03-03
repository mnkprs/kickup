import { createClient } from "@/lib/supabase/server";
import { getAllPlayers } from "@/lib/db/profiles";
import { getCaptainTeam } from "@/lib/db/teams";
import { FindPlayersClient } from "@/components/find-players/find-players-client";

export default async function FindPlayersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [players, captainTeam] = await Promise.all([
    getAllPlayers(),
    user ? getCaptainTeam(user.id) : null,
  ]);

  return (
    <FindPlayersClient
      players={players}
      captainTeamId={captainTeam?.id ?? null}
      currentUserId={user?.id ?? null}
    />
  );
}

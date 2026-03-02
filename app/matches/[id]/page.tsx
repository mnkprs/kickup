import { getMatch, getMatchGoalsByPlayer, getMatchRoster } from "@/lib/db/matches";
import { createClient } from "@/lib/supabase/server";
import { getTeamMembers } from "@/lib/db/teams";
import { MatchDetailClient } from "@/components/match-detail-client";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const match = await getMatch(id);

  if (!match) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Match not found</p>
      </div>
    );
  }

  // Determine which team the current user belongs to in this match
  let userTeamId: string | null = null;
  let teamMembers: { id: string; full_name: string; avatar_initials: string; avatar_color: string }[] = [];

  if (user) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("player_id", user.id)
      .in("team_id", [match.home_team_id, match.away_team_id])
      .maybeSingle();

    userTeamId = membership?.team_id ?? null;

    // Load team members for MVP selection when submitting result
    if (userTeamId && match.raw_status === "pre_match") {
      const members = await getTeamMembers(userTeamId);
      teamMembers = members.map((m) => ({
        id: m.profile.id,
        full_name: m.profile.full_name,
        avatar_initials: m.profile.avatar_initials,
        avatar_color: m.profile.avatar_color,
      }));
    }
  }

  // For completed matches: fetch rosters and goals per player
  let homeRoster: { player_id: string; profile: Record<string, unknown> }[] = [];
  let awayRoster: { player_id: string; profile: Record<string, unknown> }[] = [];
  let goalsByPlayer: Map<string, number> = new Map();

  if (match.raw_status === "completed") {
    const [home, away, goals] = await Promise.all([
      getMatchRoster(id, match.home_team_id),
      getMatchRoster(id, match.away_team_id),
      getMatchGoalsByPlayer(id),
    ]);
    homeRoster = home;
    awayRoster = away;
    goalsByPlayer = goals;
  }

  return (
    <MatchDetailClient
      match={match}
      userTeamId={userTeamId}
      teamMembers={teamMembers}
      homeRoster={homeRoster}
      awayRoster={awayRoster}
      goalsByPlayer={Object.fromEntries(goalsByPlayer)}
    />
  );
}

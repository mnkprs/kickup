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
  let teamMembers: {
    id: string;
    full_name: string;
    avatar_initials: string;
    avatar_color: string;
    avatar_url: string | null;
  }[] = [];
  let isTournamentOrganizer = false;

  let isCaptain = false;

  if (user) {
    const [membershipRes, tmRes, profileRes] = await Promise.all([
      supabase
        .from("team_members")
        .select("team_id, role")
        .eq("player_id", user.id)
        .in("team_id", [match.home_team_id, match.away_team_id])
        .maybeSingle(),
      supabase
        .from("tournament_matches")
        .select("tournament_id, tournaments(organizer_id)")
        .eq("match_id", id)
        .maybeSingle(),
      supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
    ]);

    const membership = membershipRes.data as { team_id: string; role: string } | null;
    userTeamId = membership?.team_id ?? null;
    isCaptain = membership?.role === "captain";

    if (tmRes.data) {
      const tournaments = tmRes.data.tournaments;
      const tournament = Array.isArray(tournaments) ? tournaments[0] : tournaments;
      isTournamentOrganizer =
        (tournament?.organizer_id === user.id) || (profileRes.data?.is_admin === true);
    }

    // Load team members for MVP selection when submitting result (captain or organizer)
    if ((userTeamId || isTournamentOrganizer) && match.raw_status === "pre_match") {
      const teamIdForMembers = userTeamId ?? match.home_team_id;
      const members = await getTeamMembers(teamIdForMembers);
      teamMembers = members.map((m) => ({
        id: m.profile.id,
        full_name: m.profile.full_name,
        avatar_initials: m.profile.avatar_initials,
        avatar_color: m.profile.avatar_color,
        avatar_url: m.profile.avatar_url ?? null,
      }));
    }
  }

  // For scheduling: fetch proposals
  let proposals: {
    id: string;
    proposed_by_team_id: string;
    proposed_date: string;
    proposed_time: string;
    location: string;
    accepted: boolean;
    team_name?: string;
  }[] = [];

  if (match.raw_status === "scheduling" && user) {
    const { data: proposalRows } = await supabase
      .from("match_proposals")
      .select("id, proposed_by_team_id, proposed_date, proposed_time, location, accepted")
      .eq("match_id", id)
      .order("created_at", { ascending: false });

    if (proposalRows?.length) {
      const teamIds = [...new Set(proposalRows.map((p) => p.proposed_by_team_id))];
      const { data: teams } = await supabase
        .from("teams")
        .select("id, name")
        .in("id", teamIds);

      const teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]));
      proposals = proposalRows.map((p) => ({
        id: p.id,
        proposed_by_team_id: p.proposed_by_team_id,
        proposed_date: p.proposed_date,
        proposed_time: typeof p.proposed_time === "string" ? p.proposed_time.slice(0, 5) : "",
        location: p.location,
        accepted: p.accepted,
        team_name: teamMap.get(p.proposed_by_team_id),
      }));
    }
  }

  // For completed matches: fetch rosters and goals per player
  // For pre_match when user can submit: fetch rosters for goal assignment
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
  } else if (
    match.raw_status === "pre_match" &&
    (userTeamId || isTournamentOrganizer)
  ) {
    const [home, away] = await Promise.all([
      getMatchRoster(id, match.home_team_id),
      getMatchRoster(id, match.away_team_id),
    ]);
    homeRoster = home;
    awayRoster = away;
  }

  return (
    <MatchDetailClient
      match={match}
      userTeamId={userTeamId}
      isCaptain={isCaptain}
      proposals={proposals}
      teamMembers={teamMembers}
      homeRoster={homeRoster}
      awayRoster={awayRoster}
      goalsByPlayer={Object.fromEntries(goalsByPlayer)}
      isTournamentOrganizer={isTournamentOrganizer}
    />
  );
}

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getMatch, getMatchGoalsByPlayer, getMatchGoalsByTeam, getMatchRoster, getMatchPendingGuests, getMatchActionHistory } from "@/lib/db/matches";
import { createClient } from "@/lib/supabase/server";
import { isTbdMatch } from "@/lib/constants";
import { getTeamMembers } from "@/lib/db/teams";
import { SkeletonMatch } from "@/components/ui/skeleton-match";

const MatchDetailClient = dynamic(
  () => import("@/components/matches/match-detail-client").then((m) => ({ default: m.MatchDetailClient })),
  { loading: () => <SkeletonMatch /> },
);

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const match = await getMatch(id);

  if (!match || isTbdMatch(match)) {
    notFound();
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
  let isAdmin = false;
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

    isAdmin = profileRes.data?.is_admin === true;
    if (tmRes.data) {
      const tournaments = tmRes.data.tournaments;
      const tournament = Array.isArray(tournaments) ? tournaments[0] : tournaments;
      isTournamentOrganizer =
        (tournament?.organizer_id === user.id) || isAdmin;
    }

    // Load team members for MVP selection when submitting result (captain, organizer, or admin)
    // Include players from BOTH teams so MVP can be selected from either side
    // Also load for disputed matches so organizer/admin can resolve
    if (
      (userTeamId || isTournamentOrganizer || isAdmin) &&
      (match.raw_status === "pre_match" || match.raw_status === "disputed" || isAdmin)
    ) {
      const [homeMembers, awayMembers] = await Promise.all([
        getTeamMembers(match.home_team_id),
        getTeamMembers(match.away_team_id),
      ]);
      const seen = new Set<string>();
      for (const m of [...homeMembers, ...awayMembers]) {
        if (seen.has(m.profile.id)) continue;
        seen.add(m.profile.id);
        teamMembers.push({
          id: m.profile.id,
          full_name: m.profile.full_name,
          avatar_initials: m.profile.avatar_initials,
          avatar_color: m.profile.avatar_color,
          avatar_url: m.profile.avatar_url ?? null,
        });
      }
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
  let initialGuestHome: { player_id: string; profile: Record<string, unknown> }[] = [];
  let initialGuestAway: { player_id: string; profile: Record<string, unknown> }[] = [];
  let goalsByPlayer: Map<string, number> = new Map();
  let goalsByTeam: { home: Record<string, number>; away: Record<string, number> } = {
    home: {},
    away: {},
  };

  // Fetch team member IDs early so we can split roster vs guests
  const [homeMembers, awayMembers] = await Promise.all([
    getTeamMembers(match.home_team_id),
    getTeamMembers(match.away_team_id),
  ]);
  const homeTeamMemberIds = homeMembers.map((m) => m.profile.id);
  const awayTeamMemberIds = awayMembers.map((m) => m.profile.id);
  const homeTeamMemberSet = new Set(homeTeamMemberIds);
  const awayTeamMemberSet = new Set(awayTeamMemberIds);

  if (match.raw_status === "completed") {
    const [home, away, goals, goalsByTeamRes] = await Promise.all([
      getMatchRoster(id, match.home_team_id),
      getMatchRoster(id, match.away_team_id),
      getMatchGoalsByPlayer(id),
      getMatchGoalsByTeam(id, match.home_team_id, match.away_team_id),
    ]);
    homeRoster = home.filter((p) => homeTeamMemberSet.has(p.player_id));
    awayRoster = away.filter((p) => awayTeamMemberSet.has(p.player_id));
    initialGuestHome = home.filter((p) => !homeTeamMemberSet.has(p.player_id));
    initialGuestAway = away.filter((p) => !awayTeamMemberSet.has(p.player_id));
    goalsByPlayer = goals;
    goalsByTeam = goalsByTeamRes;
  } else if (
    (match.raw_status === "pre_match" || match.raw_status === "disputed") &&
    (userTeamId || isTournamentOrganizer || isAdmin)
  ) {
    if (match.raw_status === "disputed") {
      const [home, away, goalsRes, goalsByTeamRes, pendingGuests] = await Promise.all([
        getMatchRoster(id, match.home_team_id),
        getMatchRoster(id, match.away_team_id),
        getMatchGoalsByPlayer(id),
        getMatchGoalsByTeam(id, match.home_team_id, match.away_team_id),
        getMatchPendingGuests(id, match.home_team_id, match.away_team_id, homeTeamMemberIds, awayTeamMemberIds),
      ]);
      homeRoster = home.filter((p) => homeTeamMemberSet.has(p.player_id));
      awayRoster = away.filter((p) => awayTeamMemberSet.has(p.player_id));
      initialGuestHome = home.filter((p) => !homeTeamMemberSet.has(p.player_id));
      initialGuestAway = away.filter((p) => !awayTeamMemberSet.has(p.player_id));
      if (initialGuestHome.length === 0 && initialGuestAway.length === 0) {
        initialGuestHome = pendingGuests.home;
        initialGuestAway = pendingGuests.away;
      }
      goalsByPlayer = goalsRes;
      goalsByTeam = goalsByTeamRes;
    } else {
      const [home, away, pendingGuests] = await Promise.all([
        getMatchRoster(id, match.home_team_id),
        getMatchRoster(id, match.away_team_id),
        getMatchPendingGuests(id, match.home_team_id, match.away_team_id, homeTeamMemberIds, awayTeamMemberIds),
      ]);
      homeRoster = home;
      awayRoster = away;
      initialGuestHome = pendingGuests.home;
      initialGuestAway = pendingGuests.away;
    }
  }

  // For admin editing: load rosters when admin views any match (for result edit form)
  if (isAdmin && homeRoster.length === 0 && awayRoster.length === 0) {
    const [home, away, goals, goalsByTeamRes] = await Promise.all([
      getMatchRoster(id, match.home_team_id),
      getMatchRoster(id, match.away_team_id),
      getMatchGoalsByPlayer(id),
      getMatchGoalsByTeam(id, match.home_team_id, match.away_team_id),
    ]);
    homeRoster = home.filter((p) => homeTeamMemberSet.has(p.player_id));
    awayRoster = away.filter((p) => awayTeamMemberSet.has(p.player_id));
    initialGuestHome = home.filter((p) => !homeTeamMemberSet.has(p.player_id));
    initialGuestAway = away.filter((p) => !awayTeamMemberSet.has(p.player_id));
    goalsByPlayer = goals;
    goalsByTeam = goalsByTeamRes;
  }

  // For admin editing completed matches: prefer roster (match_lineups) over team_members for MVP
  // so we include players who actually played, even if they've since left a team
  if (isAdmin && (homeRoster.length > 0 || awayRoster.length > 0)) {
    teamMembers = [];
    const seen = new Set<string>();
    for (const { player_id, profile } of [...homeRoster, ...awayRoster, ...initialGuestHome, ...initialGuestAway]) {
      if (seen.has(player_id)) continue;
      seen.add(player_id);
      teamMembers.push({
        id: player_id,
        full_name: (profile.full_name as string) ?? "Unknown",
        avatar_initials: (profile.avatar_initials as string) ?? "",
        avatar_color: (profile.avatar_color as string) ?? "#2E7D32",
        avatar_url: (profile.avatar_url as string) ?? null,
      });
    }
  }

  const matchActionHistory = await getMatchActionHistory(id);

  return (
    <MatchDetailClient
      match={match}
      userTeamId={userTeamId}
      isCaptain={isCaptain}
      proposals={proposals}
      teamMembers={teamMembers}
      homeRoster={homeRoster}
      awayRoster={awayRoster}
      initialGuestHome={initialGuestHome}
      initialGuestAway={initialGuestAway}
      homeTeamMemberIds={homeTeamMemberIds}
      awayTeamMemberIds={awayTeamMemberIds}
      goalsByPlayer={Object.fromEntries(goalsByPlayer)}
      goalsByTeam={goalsByTeam}
      isTournamentOrganizer={isTournamentOrganizer}
      isAdmin={isAdmin}
      matchActionHistory={matchActionHistory}
    />
  );
}

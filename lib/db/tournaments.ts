import { createClient } from "@/lib/supabase/server";
import type { Tournament, TournamentStanding, Match, Team, TopScorer } from "@/lib/types";

function mapTournamentStatus(
  dbStatus: string
): Tournament["status"] {
  switch (dbStatus) {
    case "registration":
      return "upcoming";
    case "group_stage":
    case "knockout_stage":
      return "in_progress";
    case "completed":
      return "completed";
    default:
      return "upcoming";
  }
}

function mapTeam(row: Record<string, unknown>): Team {
  return {
    id: row.id as string,
    name: row.name as string,
    short_name: row.short_name as string,
    area: row.area as string,
    format: row.format as string,
    emoji: (row.emoji as string) ?? "⚽",
    color: (row.color as string) ?? "#2E7D32",
    description: (row.description as string) ?? "",
    open_spots: (row.open_spots as number) ?? 0,
    wins: (row.record_w as number) ?? 0,
    draws: (row.record_d as number) ?? 0,
    losses: (row.record_l as number) ?? 0,
    goals_for: (row.record_gf as number) ?? 0,
    goals_against: (row.record_ga as number) ?? 0,
    points: (row.points as number) ?? 0,
    captain_id: row.captain_id as string | null,
    home_ground: row.home_ground as string | null,
    searching_for_opponent: (row.searching_for_opponent as boolean) ?? false,
    created_at: row.created_at as string,
  };
}

export async function getTournaments(): Promise<Tournament[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .select(`
      *,
      organizer:profiles!organizer_id(full_name),
      tournament_registrations(team_id, status, teams(*)),
      tournament_matches(id, match_id, matches(status))
    `)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const registrations = (row.tournament_registrations as Record<string, unknown>[]) ?? [];
    const approvedRegs = registrations.filter((r) => r.status === "approved");
    const enrolledTeams: Team[] = approvedRegs
      .map((r) => r.teams as Record<string, unknown>)
      .filter(Boolean)
      .map(mapTeam);

    const tournamentMatches = (row.tournament_matches as Record<string, unknown>[]) ?? [];
    const completedMatches = tournamentMatches.filter(
      (tm) => (tm.matches as Record<string, unknown>)?.status === "completed"
    );

    const organizer = row.organizer as Record<string, unknown> | null;

    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) ?? "",
      organizer_id: row.organizer_id as string,
      organizer: (organizer?.full_name as string) ?? "Unknown",
      venue: (row.venue as string) ?? "",
      area: (row.area as string) ?? "",
      format: (row.bracket_format as string) ?? "knockout",
      match_format: row.match_format as string,
      max_teams: (row.max_teams as number) ?? 8,
      prize: (row.prize as string) ?? "",
      entry_fee: (row.entry_fee as string) ?? "",
      start_date: row.start_date as string | null,
      end_date: row.end_date as string | null,
      status: mapTournamentStatus(row.status as string),
      teams_count: approvedRegs.length,
      matches_played: completedMatches.length,
      total_matches: tournamentMatches.length,
      enrolled_teams: enrolledTeams,
      pending_registrations: [],
      created_at: row.created_at as string,
    };
  });
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tournaments")
    .select(`
      *,
      organizer:profiles!organizer_id(full_name),
      tournament_registrations(id, team_id, status, teams(*)),
      tournament_matches(id, match_id, matches(status))
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const registrations = (row.tournament_registrations as Record<string, unknown>[]) ?? [];
  const approvedRegs = registrations.filter((r) => r.status === "approved");
  const pendingRegs = registrations.filter((r) => r.status === "pending");
  const enrolledTeams: Team[] = approvedRegs
    .map((r) => r.teams as Record<string, unknown>)
    .filter(Boolean)
    .map(mapTeam);
  const pendingRegistrations = pendingRegs
    .map((r) => r.teams as Record<string, unknown>)
    .filter(Boolean)
    .map((teams, i) => ({
      id: (pendingRegs[i] as { id: string }).id,
      team_id: (pendingRegs[i] as { team_id: string }).team_id,
      team: mapTeam(teams),
    }));

  const tournamentMatches = (row.tournament_matches as Record<string, unknown>[]) ?? [];
  const completedMatches = tournamentMatches.filter(
    (tm) => (tm.matches as Record<string, unknown>)?.status === "completed"
  );

  const organizer = row.organizer as Record<string, unknown> | null;

  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? "",
    organizer_id: row.organizer_id as string,
    organizer: (organizer?.full_name as string) ?? "Unknown",
    venue: (row.venue as string) ?? "",
    area: (row.area as string) ?? "",
    format: (row.bracket_format as string) ?? "knockout",
    match_format: row.match_format as string,
    max_teams: (row.max_teams as number) ?? 8,
    prize: (row.prize as string) ?? "",
    entry_fee: (row.entry_fee as string) ?? "",
    start_date: row.start_date as string | null,
    end_date: row.end_date as string | null,
    status: mapTournamentStatus(row.status as string),
    raw_status: row.status as string,
    teams_count: approvedRegs.length,
    matches_played: completedMatches.length,
    total_matches: tournamentMatches.length,
    enrolled_teams: enrolledTeams,
    pending_registrations: pendingRegistrations,
    created_at: row.created_at as string,
  };
}

export async function getTournamentStandings(
  tournamentId: string
): Promise<TournamentStanding[]> {
  const supabase = await createClient();

  // Get group labels for this tournament (group stage has started)
  const { data: groups } = await supabase
    .from("tournament_groups")
    .select("group_label")
    .eq("tournament_id", tournamentId);

  if (groups && groups.length > 0) {
    const labels = [...new Set((groups as { group_label: string }[]).map((g) => g.group_label))];

    const { data, error } = await supabase.rpc("get_tournament_standings", {
      p_tournament_id: tournamentId,
      p_group_label: labels[0],
    });

    if (error || !data) return [];

    const teamIds = (data as Record<string, unknown>[]).map((row) => row.team_id as string);
    const { data: teamsData } = await supabase
      .from("teams")
      .select("*")
      .in("id", teamIds);

    const teamsMap = new Map<string, Team>(
      ((teamsData as Record<string, unknown>[]) ?? []).map((t) => [
        t.id as string,
        mapTeam(t),
      ])
    );

    return (data as Record<string, unknown>[]).map((row) => ({
      rank: row.rank as number,
      team_id: row.team_id as string,
      team: teamsMap.get(row.team_id as string) ?? {
        id: row.team_id as string,
        name: row.name as string,
        short_name: (row.name as string).substring(0, 3).toUpperCase(),
        area: "",
        format: "",
        emoji: "⚽",
        color: "#2E7D32",
        description: "",
        open_spots: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0,
        created_at: "",
      },
      played: row.played as number,
      won: row.w as number,
      drawn: row.d as number,
      lost: row.l as number,
      goals_for: row.gf as number,
      goals_against: row.ga as number,
      goal_diff: row.gd as number,
      points: row.pts as number,
    }));
  }

  // Registration phase: show enrolled teams as standings (0 stats until tournament starts)
  const { data: regs } = await supabase
    .from("tournament_registrations")
    .select("team_id")
    .eq("tournament_id", tournamentId)
    .eq("status", "approved")
    .order("applied_at", { ascending: true });

  if (!regs || regs.length === 0) return [];

  const teamIds = (regs as { team_id: string }[]).map((r) => r.team_id);
  const { data: teamsData } = await supabase
    .from("teams")
    .select("*")
    .in("id", teamIds);

  const teams = ((teamsData as Record<string, unknown>[]) ?? []).map(mapTeam);

  return teams.map((team, i) => ({
    rank: i + 1,
    team_id: team.id,
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    goal_diff: 0,
    points: 0,
  }));
}

export async function getTournamentMatches(
  tournamentId: string
): Promise<Match[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournament_matches")
    .select(`
      matches(
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*)
      )
    `)
    .eq("tournament_id", tournamentId)
    .order("match_order", { ascending: true });

  if (error || !data) return [];

  return (data as Record<string, unknown>[])
    .map((row) => {
      const m = row.matches as Record<string, unknown>;
      if (!m) return null;
      return {
        id: m.id as string,
        home_team_id: m.home_team_id as string,
        away_team_id: m.away_team_id as string,
        home_team: mapTeam(m.home_team as Record<string, unknown>),
        away_team: mapTeam(m.away_team as Record<string, unknown>),
        format: m.format as string,
        status:
          m.status === "completed"
            ? "completed"
            : ("upcoming" as Match["status"]),
        date: m.match_date as string | null,
        time: m.match_time as string | null,
        location: m.location as string | null,
        home_score: m.home_score as number | null,
        away_score: m.away_score as number | null,
        created_at: m.created_at as string,
      };
    })
    .filter((m): m is Match => m !== null);
}

export async function getTournamentTopScorers(
  tournamentId: string
): Promise<TopScorer[]> {
  const supabase = await createClient();

  // Get match IDs for this tournament
  const { data: tmData } = await supabase
    .from("tournament_matches")
    .select("match_id")
    .eq("tournament_id", tournamentId);

  if (!tmData || tmData.length === 0) return [];

  const matchIds = (tmData as { match_id: string }[]).map((t) => t.match_id);

  // Get goal events
  const { data: events } = await supabase
    .from("match_events")
    .select("scorer_id, match_id")
    .in("match_id", matchIds);

  if (!events || events.length === 0) return [];

  // Tally goals per player
  const tally = new Map<string, number>();
  for (const ev of events as { scorer_id: string }[]) {
    tally.set(ev.scorer_id, (tally.get(ev.scorer_id) ?? 0) + 1);
  }

  const topPlayerIds = [...tally.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);

  // Fetch profiles + team membership
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, team_members(team_id, teams(short_name))")
    .in("id", topPlayerIds);

  if (!profiles) return [];

  return (profiles as Record<string, unknown>[]).map((p) => {
    const goals = tally.get(p.id as string) ?? 0;
    const memberships = p.team_members as Record<string, unknown>[];
    const teamShortName =
      ((memberships?.[0]?.teams as Record<string, unknown>)
        ?.short_name as string) ?? "—";

    return {
      player: {
        id: p.id as string,
        full_name: p.full_name as string,
        avatar_initials: p.avatar_initials as string,
        avatar_color: p.avatar_color as string,
        avatar_url: p.avatar_url as string | null,
        position: p.position as string | null,
        area: p.area as string | null,
        bio: (p.bio as string) ?? "",
        is_freelancer: (p.is_freelancer as boolean) ?? false,
        is_field_owner: (p.is_field_owner as boolean) ?? false,
        is_admin: (p.is_admin as boolean) ?? false,
        matches_played: (p.stat_matches as number) ?? 0,
        goals: (p.stat_goals as number) ?? 0,
        wins: (p.stat_wins as number) ?? 0,
        draws: (p.stat_draws as number) ?? 0,
        losses: (p.stat_losses as number) ?? 0,
        man_of_match: (p.stat_mvp as number) ?? 0,
        yellow_cards: (p.stat_yellow_cards as number) ?? 0,
        red_cards: (p.stat_red_cards as number) ?? 0,
        clean_sheets: (p.stat_clean_sheets as number) ?? 0,
        team_id: null,
        joined_date: p.created_at as string,
        created_at: p.created_at as string,
      },
      team_short_name: teamShortName,
      goals,
    };
  });
}

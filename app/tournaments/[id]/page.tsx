import { notFound } from "next/navigation";
import {
  getTournament,
  getTournamentStandings,
  getTournamentMatchesWithStage,
  getTournamentTopScorers,
} from "@/lib/db/tournaments";
import { getProfile } from "@/lib/db/profiles";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { createClient } from "@/lib/supabase/server";
import { TournamentStandings } from "@/components/tournament-standings";
import { TournamentFixtures } from "@/components/tournament-fixtures";
import { TournamentBracket } from "@/components/tournament-bracket";
import { LiveDot } from "@/components/live-dot";
import { TournamentScorers } from "@/components/tournament-scorers";
import { TournamentPendingRegistrations } from "@/components/tournament-pending-registrations";
import { TournamentOrganizerControls } from "@/components/tournament-organizer-controls";
import { TournamentEditButton } from "@/components/tournament-edit-button";
import { TournamentDetailsAccordion } from "@/components/tournament-details-accordion";
import { RegisterTournamentButton } from "@/components/register-tournament-button";

function getStatusStyle(status: string) {
  switch (status) {
    case "in_progress":
      return { bg: "bg-win/15", text: "text-win", label: "Live" };
    case "upcoming":
      return { bg: "bg-draw/15", text: "text-draw", label: "Upcoming" };
    case "completed":
      return { bg: "bg-muted-foreground/15", text: "text-muted-foreground", label: "Completed" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground", label: status };
  }
}

function getFormatLabel(fmt: string) {
  switch (fmt) {
    case "knockout": return "Knockout";
    case "round_robin": return "Round Robin";
    case "group_stage": return "Groups + KO";
    default: return fmt;
  }
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [tournament, standings, matches, scorers, profile, areasRes] = await Promise.all([
    getTournament(id),
    getTournamentStandings(id),
    getTournamentMatchesWithStage(id),
    getTournamentTopScorers(id),
    user ? getProfile(user.id) : null,
    supabase.from("areas").select("name, city").order("city").order("sort"),
  ]);
  const areasData = areasRes.data;

  const cityMap: Record<string, string[]> = {};
  for (const row of areasData ?? []) {
    if (!cityMap[row.city]) cityMap[row.city] = [];
    cityMap[row.city].push(row.name);
  }
  const areaGroups = Object.entries(cityMap).map(([city, areas]) => ({ city, areas }));

  if (!tournament) notFound();

  // Check user's team + registration status (only captains can register)
  let userTeamId: string | null = null;
  let registrationStatus: "none" | "pending" | "approved" | "rejected" = "none";

  if (user) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("player_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membership?.team_id && membership?.role === "captain") {
      userTeamId = membership.team_id;
      const { data: reg } = await supabase
        .from("tournament_registrations")
        .select("status")
        .eq("tournament_id", id)
        .eq("team_id", userTeamId)
        .maybeSingle();
      if (reg) registrationStatus = reg.status as typeof registrationStatus;
    }
  }

  const statusStyle = getStatusStyle(tournament.status);
  const isOrganizer = user?.id === tournament.organizer_id;
  const isAdmin = profile?.is_admin === true;
  // Organiser and admin can manage registrations, advance to knockouts, etc.
  const canManageRegistrations = isOrganizer || isAdmin;

  return (
    <div className="tournament-detail-page">
      <header className="tournament-detail-header px-5 pt-12 pb-4">
        <div className="tournament-detail-header__top flex items-center gap-3 mb-5">
          <BackButton />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {tournament.status === "in_progress" && <LiveDot className="shrink-0" />}
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${statusStyle.text} ${statusStyle.bg} px-2 py-0.5 rounded-full`}
              >
                {statusStyle.label}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {getFormatLabel(tournament.format)}
              </span>
            </div>
            <h1 className="text-foreground font-semibold text-base truncate">
              {tournament.name}
            </h1>
          </div>
          {canManageRegistrations && (
            <TournamentEditButton tournament={tournament} areaGroups={areaGroups} />
          )}
        </div>

        {/* Register button (upcoming only, user has a team) */}
      {userTeamId && tournament.status === "upcoming" && (
        <div className="mt-4">
          <RegisterTournamentButton
            tournamentId={id}
            teamId={userTeamId}
            registrationStatus={registrationStatus}
            isFull={tournament.teams_count >= tournament.max_teams}
            canWithdraw={tournament.raw_status === "registration"}
          />
        </div>
      )}
      </header>

      <main className="tournament-detail__main flex flex-col gap-6 pb-24 pt-2">
        <TournamentDetailsAccordion
          details={{
            organizerId: tournament.organizer_id,
            organizer: tournament.organizer,
            bracketFormat: tournament.format,
            matchFormat: tournament.match_format,
            startDate: tournament.start_date,
            endDate: tournament.end_date,
            area: tournament.area,
            venue: tournament.venue,
            teamsCount: tournament.teams_count,
            maxTeams: tournament.max_teams,
            prize: tournament.prize,
            description: tournament.description,
          }}
        />

        {canManageRegistrations && tournament.pending_registrations.length > 0 && (
          <TournamentPendingRegistrations
            registrations={tournament.pending_registrations}
            tournamentId={id}
          />
        )}

        {canManageRegistrations && tournament.raw_status && tournament.raw_status !== "completed" && (
          <TournamentOrganizerControls
            tournamentId={id}
            rawStatus={tournament.raw_status}
            teamsCount={tournament.teams_count}
            knockoutMode={tournament.knockout_mode}
            knockoutMatches={matches.filter(
              (m) =>
                m.stage === "round_of_16" ||
                m.stage === "quarter_final" ||
                m.stage === "semi_final" ||
                m.stage === "final"
            )}
            advancingTeams={standings.flatMap((g) =>
              g.standings.slice(0, 2).map((s) => ({
                id: s.team_id,
                name: s.team.name,
                short_name: s.team.short_name,
              }))
            )}
          />
        )}

        <TournamentStandings
          standingsGroups={standings}
          title={tournament.status === "upcoming" ? "Enrolled Teams" : "Standings"}
          canRemoveTeam={canManageRegistrations && tournament.raw_status === "registration"}
          tournamentId={canManageRegistrations && tournament.raw_status === "registration" ? id : undefined}
        />
        {tournament.raw_status === "knockout_stage" && (
          <TournamentBracket matches={matches} />
        )}
        <TournamentFixtures
          matches={matches}
          tournamentId={id}
          canManageSchedule={canManageRegistrations && tournament.status === "in_progress"}
        />
        <TournamentScorers scorers={scorers} />

        {standings.every((g) => g.standings.length === 0) && matches.length === 0 && scorers.length === 0 && (
          <section className="tournament-detail__empty px-5 py-8 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Trophy size={20} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {tournament.status === "upcoming"
                ? "Waiting for teams to join. Start the tournament when ready."
                : "No data available yet"}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

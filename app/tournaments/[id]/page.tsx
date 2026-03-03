import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getTournament,
  getTournamentStandings,
  getTournamentMatchesWithStage,
  getTournamentTopScorers,
} from "@/lib/db/tournaments";
import { getProfile } from "@/lib/db/profiles";
import { LiveDot } from "@/components/live-dot";
import { BackButton } from "@/components/back-button";
import { createClient } from "@/lib/supabase/server";
import { TournamentEditButton } from "@/components/tournament-edit-button";
import { RegisterTournamentButton } from "@/components/register-tournament-button";
import { TournamentDetailClient } from "@/components/tournament-detail-client";

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

      <Suspense fallback={<div className="h-32 animate-pulse bg-muted/30 rounded-xl mx-5" />}>
        <TournamentDetailClient
        tournamentId={id}
        tournament={tournament}
        standings={standings}
        matches={matches}
        scorers={scorers}
        canManageRegistrations={canManageRegistrations}
      />
      </Suspense>
    </div>
  );
}

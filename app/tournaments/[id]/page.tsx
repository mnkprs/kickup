import { notFound } from "next/navigation";
import {
  getTournament,
  getTournamentStandings,
  getTournamentMatches,
  getTournamentTopScorers,
} from "@/lib/db/tournaments";
import { ArrowLeft, Trophy, Calendar, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { TournamentStandings } from "@/components/tournament-standings";
import { TournamentFixtures } from "@/components/tournament-fixtures";
import { TournamentScorers } from "@/components/tournament-scorers";
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

  const [tournament, standings, matches, scorers] = await Promise.all([
    getTournament(id),
    getTournamentStandings(id),
    getTournamentMatches(id),
    getTournamentTopScorers(id),
  ]);

  if (!tournament) notFound();

  // Check user's team + registration status
  let userTeamId: string | null = null;
  let registrationStatus: "none" | "pending" | "approved" | "rejected" = "none";

  if (user) {
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("player_id", user.id)
      .maybeSingle();

    if (membership?.team_id) {
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

  return (
    <>
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/tournaments"
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
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
        </div>

        {/* Register button (upcoming only, user has a team) */}
      {userTeamId && tournament.status === "upcoming" && (
        <div className="mt-4">
          <RegisterTournamentButton
            tournamentId={id}
            teamId={userTeamId}
            registrationStatus={registrationStatus}
            isFull={tournament.teams_count >= tournament.max_teams}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {tournament.start_date && (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {format(parseISO(tournament.start_date), "d MMM")}
                {tournament.end_date && tournament.end_date !== tournament.start_date &&
                  ` – ${format(parseISO(tournament.end_date), "d MMM yyyy")}`}
              </span>
            </div>
          )}
          {tournament.area && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground text-xs">{tournament.area}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-muted-foreground" />
            <span className="text-muted-foreground text-xs">
              {tournament.teams_count}/{tournament.max_teams} teams
            </span>
          </div>
          {tournament.prize && (
            <div className="flex items-center gap-1">
              <Trophy size={11} className="text-draw" />
              <span className="text-draw text-[11px] font-medium">{tournament.prize}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex flex-col gap-6 pb-24 pt-2">
        {tournament.description && (
          <section className="px-5">
            <p className="text-muted-foreground text-sm">{tournament.description}</p>
          </section>
        )}

        {standings.length > 0 && <TournamentStandings standings={standings} />}
        {matches.length > 0 && <TournamentFixtures matches={matches} />}
        {scorers.length > 0 && <TournamentScorers scorers={scorers} />}

        {standings.length === 0 && matches.length === 0 && (
          <section className="px-5 py-12 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Trophy size={20} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No data available yet</p>
          </section>
        )}
      </main>
    </>
  );
}

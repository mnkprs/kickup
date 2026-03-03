import type { Tournament } from "@/lib/types";
import { Trophy, Calendar, Users, ChevronRight, UserCheck } from "lucide-react";
import { LiveDot } from "@/components/ui/live-dot";
import { format, parseISO } from "date-fns";
import Link from "next/link";

interface TournamentsBannerProps {
  tournaments: Tournament[];
  userTeamId: string | null;
}

function isParticipating(tournament: Tournament, userTeamId: string | null): boolean {
  if (!userTeamId) return false;
  return tournament.enrolled_teams.some((t) => t.id === userTeamId);
}

function TournamentCard({
  tournament,
  isParticipatingLeague,
}: {
  tournament: Tournament;
  isParticipatingLeague: boolean;
}) {
  const isLive = tournament.status === "in_progress";
  const isUpcoming = tournament.status === "upcoming";
  const accentStyle = isParticipatingLeague || isLive;

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={`tournaments-banner__card ${accentStyle ? "tournaments-banner__card--accent" : ""} ${
        accentStyle
          ? "rounded-xl p-4 group transition-all shadow-card-accent hover:shadow-card-accent-hover block bg-gradient-accent"
          : "rounded-xl bg-card border border-border shadow-card p-4 group hover:border-accent/40 transition-colors block pressable"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isParticipatingLeague && (
            <UserCheck size={14} className="text-accent-foreground/60 shrink-0" />
          )}
          {isLive && (
            <>
              <LiveDot className="shrink-0" />
              <Trophy size={14} className="text-draw" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground/70">
                Live
              </span>
            </>
          )}
          {isUpcoming && !isParticipatingLeague && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-draw bg-draw/15 px-2 py-0.5 rounded-full">
              Upcoming
            </span>
          )}
          {isParticipatingLeague && !isLive && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground/70">
              My League
            </span>
          )}
        </div>
        <ChevronRight
          size={16}
          className={
            accentStyle
              ? "text-accent-foreground/50 group-hover:text-accent-foreground transition-colors"
              : "text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
          }
        />
      </div>
      <h3
        className={
          accentStyle
            ? "text-accent-foreground font-semibold text-sm mb-2"
            : "text-foreground font-medium text-sm mb-1"
        }
      >
        {tournament.name}
      </h3>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className={accentStyle ? "text-accent-foreground/60" : "text-muted-foreground"} />
          <span className={accentStyle ? "text-accent-foreground/60 text-xs" : "text-muted-foreground text-xs"}>
            {isUpcoming ? (
              <>Starts {tournament.start_date ? format(parseISO(tournament.start_date), "d MMM yyyy") : "TBC"}</>
            ) : (
              <>
                {tournament.start_date ? format(parseISO(tournament.start_date), "d MMM") : "TBC"} -{" "}
                {tournament.end_date ? format(parseISO(tournament.end_date), "d MMM") : "TBC"}
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={12} className={accentStyle ? "text-accent-foreground/60" : "text-muted-foreground"} />
          <span className={accentStyle ? "text-accent-foreground/60 text-xs" : "text-muted-foreground text-xs"}>
            {tournament.teams_count} teams
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TournamentsBanner({ tournaments, userTeamId }: TournamentsBannerProps) {
  const activeTournaments = tournaments.filter((t) => t.status !== "completed");
  const participatingList = activeTournaments.filter((t) => isParticipating(t, userTeamId));
  const upcomingList = activeTournaments.filter(
    (t) => t.status === "upcoming" && !isParticipating(t, userTeamId)
  );
  const liveList = activeTournaments.filter(
    (t) => t.status === "in_progress" && !isParticipating(t, userTeamId)
  );

  const ordered = [...participatingList, ...upcomingList, ...liveList];

  return (
    <section className="tournaments-banner px-5">
      <div className="tournaments-banner__header flex items-center justify-between mb-3">
        <h2 className="tournaments-banner__title text-foreground font-semibold text-base">Leagues</h2>
        <Link href="/tournaments" className="text-accent text-xs font-medium hover:underline">
          Browse
        </Link>
      </div>

      <div className="tournaments-banner__list flex flex-col gap-3">
        {ordered.map((tournament) => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            isParticipatingLeague={isParticipating(tournament, userTeamId)}
          />
        ))}
      </div>
    </section>
  );
}

import type { Tournament } from "@/lib/types";
import {
  Trophy,
  Calendar,
  Users,
  ChevronRight,
  MapPin,
  Zap,
  Clock,
} from "lucide-react";
import { LiveDot } from "@/components/live-dot";
import { format, parseISO } from "date-fns";
import Link from "next/link";

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

function getFormatLabel(format: string) {
  switch (format) {
    case "knockout":
      return "Knockout";
    case "round_robin":
      return "Round Robin";
    case "group_stage":
      return "Groups + KO";
    default:
      return format;
  }
}

function formatDate(dateStr: string | null, formatStr: string = "d MMM") {
  if (!dateStr) return "TBC";
  return format(parseISO(dateStr), formatStr);
}

function ActiveTournamentCard({
  tournament,
}: {
  tournament: Tournament;
}) {
  const progress = Math.round(
    (tournament.matches_played / tournament.total_matches) * 100
  );

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="rounded-xl p-4 cursor-pointer group transition-all shadow-card-accent hover:shadow-card-accent-hover bg-gradient-accent block"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <LiveDot className="shrink-0" />
          <Trophy size={14} className="text-draw" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground/70">
            Live
          </span>
        </div>
        <ChevronRight
          size={16}
          className="text-accent-foreground/50 group-hover:text-accent-foreground transition-colors"
        />
      </div>
      <h3 className="text-accent-foreground font-semibold text-sm mb-1">
        {tournament.name}
      </h3>
      <p className="text-accent-foreground/50 text-xs mb-3 line-clamp-2">
        {tournament.description}
      </p>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-accent-foreground/60" />
          <span className="text-accent-foreground/60 text-xs">
            {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-accent-foreground/60" />
          <span className="text-accent-foreground/60 text-xs">
            {tournament.teams_count} teams
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-accent-foreground/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-foreground/70 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-accent-foreground/50 text-[10px] shrink-0">
          {tournament.matches_played}/{tournament.total_matches} matches
        </span>
      </div>
    </Link>
  );
}

function TournamentCard({
  tournament,
}: {
  tournament: Tournament;
}) {
  const statusStyle = getStatusStyle(tournament.status);
  const spotsLeft = tournament.max_teams - tournament.teams_count;

  return (
    <Link href={`/tournaments/${tournament.id}`} className="rounded-xl bg-card border border-border shadow-card p-4 cursor-pointer group hover:border-accent/40 transition-colors block pressable">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
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
        <ChevronRight
          size={16}
          className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
        />
      </div>

      <h3 className="text-foreground font-semibold text-sm mb-1">
        {tournament.name}
      </h3>
      <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
        {tournament.description}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-muted-foreground" />
          <span className="text-muted-foreground text-xs">
            {formatDate(tournament.start_date)}
            {tournament.start_date !== tournament.end_date &&
              ` - ${formatDate(tournament.end_date)}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-muted-foreground" />
          <span className="text-muted-foreground text-xs">
            {tournament.area}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-muted-foreground" />
          <span className="text-muted-foreground text-xs">
            {tournament.teams_count}/{tournament.max_teams} teams
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-3">
          {tournament.prize && (
            <div className="flex items-center gap-1">
              <Trophy size={11} className="text-draw" />
              <span className="text-draw text-[11px] font-medium">
                {tournament.prize}
              </span>
            </div>
          )}
        </div>
        {tournament.status === "upcoming" && spotsLeft > 0 && (
          <span className="text-accent text-[11px] font-medium">
            {spotsLeft} spots left
          </span>
        )}
        {tournament.status === "completed" && (
          <span className="text-muted-foreground text-[11px]">
            {tournament.matches_played} matches played
          </span>
        )}
      </div>
    </Link>
  );
}

interface TournamentListProps {
  tournaments: Tournament[];
  filter: string;
}

export function TournamentList({ tournaments, filter }: TournamentListProps) {
  const filtered =
    filter === "All"
      ? tournaments
      : tournaments.filter((t) => {
          if (filter === "Active") return t.status === "in_progress";
          if (filter === "Upcoming") return t.status === "upcoming";
          if (filter === "Completed") return t.status === "completed";
          return true;
        });

  const active = filtered.filter((t) => t.status === "in_progress");
  const rest = filtered.filter((t) => t.status !== "in_progress");

  return (
    <section className="px-5">
      {active.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-win" />
            <h2 className="text-foreground font-semibold text-sm">
              Active Now
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {active.map((t) => (
              <ActiveTournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          {active.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-muted-foreground" />
              <h2 className="text-foreground font-semibold text-sm">
                {filter === "Completed"
                  ? "Past Leagues"
                  : filter === "Upcoming"
                    ? "Coming Soon"
                    : "All Leagues"}
              </h2>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {rest.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Trophy size={20} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            No leagues found
          </p>
        </div>
      )}
    </section>
  );
}

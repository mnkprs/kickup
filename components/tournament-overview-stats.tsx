import type { Tournament } from "@/lib/types";
import { Trophy, Calendar, Users, Swords } from "lucide-react";

interface TournamentOverviewStatsProps {
  tournaments: Tournament[];
}

export function TournamentOverviewStats({ tournaments }: TournamentOverviewStatsProps) {
  const active = tournaments.filter((t) => t.status === "in_progress").length;
  const upcoming = tournaments.filter((t) => t.status === "upcoming").length;
  const totalTeams = new Set(
    tournaments.flatMap((t) => t.enrolled_teams.map((team) => team.id))
  ).size;
  const totalMatches = tournaments.reduce((sum, t) => sum + t.matches_played, 0);

  const stats = [
    { label: "Active", value: active, icon: Trophy, iconClass: "text-win", bgClass: "bg-win/10" },
    { label: "Upcoming", value: upcoming, icon: Calendar, iconClass: "text-draw", bgClass: "bg-draw/10" },
    { label: "Teams", value: totalTeams, icon: Users, iconClass: "text-info", bgClass: "bg-info/10" },
    { label: "Played", value: totalMatches, icon: Swords, iconClass: "text-muted-foreground", bgClass: "bg-muted" },
  ];

  return (
    <section className="px-5">
      <div className="grid grid-cols-4 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border px-2 py-3"
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.bgClass}`}>
              <stat.icon size={16} className={stat.iconClass} />
            </div>
            <span className="text-foreground font-bold text-lg leading-none">{stat.value}</span>
            <span className="text-muted-foreground text-[11px] leading-none">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

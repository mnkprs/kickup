"use client";

import { tournaments } from "@/lib/mock-data";
import { Trophy, Calendar, Users, Swords, Target } from "lucide-react";

export function TournamentOverviewStats() {
  const active = tournaments.filter((t) => t.status === "in_progress").length;
  const upcoming = tournaments.filter((t) => t.status === "upcoming").length;
  const totalTeams = new Set(
    tournaments.flatMap((t) => t.enrolled_teams.map((team) => team.id))
  ).size;
  const totalMatches = tournaments.reduce(
    (sum, t) => sum + t.matches_played,
    0
  );

  const stats = [
    { label: "Active", value: active, icon: Trophy, color: "#2E7D32" },
    { label: "Upcoming", value: upcoming, icon: Calendar, color: "#F9A825" },
    { label: "Teams", value: totalTeams, icon: Users, color: "#42A5F5" },
    { label: "Played", value: totalMatches, icon: Swords, color: "#A3A3A3" },
  ];

  return (
    <section className="px-5">
      <div className="grid grid-cols-4 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border px-2 py-3"
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <span className="text-foreground font-bold text-lg leading-none">
              {stat.value}
            </span>
            <span className="text-muted-foreground text-[11px] leading-none">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

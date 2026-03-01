"use client";

import { teams } from "@/lib/mock-data";
import Link from "next/link";

export function LeagueStandings() {
  const sortedTeams = [...teams].sort((a, b) => b.points - a.points);

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-base">
          League Standings
        </h2>
        <Link
          href="/tournaments"
          className="text-accent text-xs font-medium hover:underline"
        >
          Full table
        </Link>
      </div>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_3rem] gap-1 px-4 py-2.5 border-b border-border">
          <span className="text-muted-foreground text-[10px] font-medium">
            #
          </span>
          <span className="text-muted-foreground text-[10px] font-medium">
            Team
          </span>
          <span className="text-muted-foreground text-[10px] font-medium text-center">
            W
          </span>
          <span className="text-muted-foreground text-[10px] font-medium text-center">
            D
          </span>
          <span className="text-muted-foreground text-[10px] font-medium text-center">
            L
          </span>
          <span className="text-muted-foreground text-[10px] font-medium text-center">
            GD
          </span>
          <span className="text-muted-foreground text-[10px] font-medium text-right">
            PTS
          </span>
        </div>

        {/* Table Rows */}
        {sortedTeams.map((team, i) => {
          const isMyTeam = team.id === "team_001";
          const gd = team.goals_for - team.goals_against;
          return (
            <div
              key={team.id}
              className={`grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_3rem] gap-1 px-4 py-2.5 items-center border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                isMyTeam
                  ? "bg-accent/8 hover:bg-accent/12"
                  : "hover:bg-muted/30"
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  i < 3 ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                  <span className="text-foreground text-[8px] font-bold">
                    {team.short_name}
                  </span>
                </div>
                <span
                  className={`text-sm truncate ${
                    isMyTeam
                      ? "text-accent font-semibold"
                      : "text-foreground font-medium"
                  }`}
                >
                  {team.name}
                </span>
              </div>
              <span className="text-foreground text-xs text-center">
                {team.wins}
              </span>
              <span className="text-foreground text-xs text-center">
                {team.draws}
              </span>
              <span className="text-foreground text-xs text-center">
                {team.losses}
              </span>
              <span
                className={`text-xs text-center font-medium ${
                  gd > 0
                    ? "text-win"
                    : gd < 0
                      ? "text-loss"
                      : "text-muted-foreground"
                }`}
              >
                {gd > 0 ? `+${gd}` : gd}
              </span>
              <span className="text-foreground text-xs font-bold text-right">
                {team.points}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

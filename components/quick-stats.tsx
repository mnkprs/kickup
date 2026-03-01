"use client";

import { currentUser } from "@/lib/mock-data";
import { Trophy, Crosshair, Percent, Swords } from "lucide-react";

const winRate =
  currentUser.matches_played > 0
    ? Math.round((currentUser.wins / currentUser.matches_played) * 100)
    : 0;

const stats = [
  {
    label: "Played",
    value: currentUser.matches_played,
    icon: Swords,
    color: "#A3A3A3",
  },
  {
    label: "Wins",
    value: currentUser.wins,
    icon: Trophy,
    color: "#2E7D32",
  },
  {
    label: "Goals",
    value: currentUser.goals,
    icon: Crosshair,
    color: "#F9A825",
  },
  {
    label: "Win %",
    value: `${winRate}`,
    icon: Percent,
    color: "#42A5F5",
  },
];

export function QuickStats() {
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

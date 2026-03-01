"use client";

import { currentUser } from "@/lib/mock-data";
import {
  Crosshair,
  Handshake,
  Swords,
  Trophy,
  ShieldAlert,
  Star,
} from "lucide-react";

const stats = [
  { label: "Goals", value: currentUser.goals, icon: Crosshair, color: "#F9A825" },
  { label: "Assists", value: currentUser.assists, icon: Handshake, color: "#42A5F5" },
  { label: "Matches", value: currentUser.matches_played, icon: Swords, color: "#A3A3A3" },
  { label: "Wins", value: currentUser.wins, icon: Trophy, color: "#2E7D32" },
  {
    label: "Cards",
    value: (currentUser.yellow_cards ?? 0) + (currentUser.red_cards ?? 0),
    icon: ShieldAlert,
    color: "#E65100",
  },
  { label: "MOTM", value: currentUser.man_of_match ?? 0, icon: Star, color: "#F9A825" },
];

export function ProfileStats() {
  return (
    <section className="px-5">
      <h2 className="text-foreground font-semibold text-base mb-3">Season Stats</h2>
      <div className="grid grid-cols-3 gap-2.5">
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

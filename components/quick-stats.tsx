import type { Profile } from "@/lib/types";
import { Trophy, Crosshair, Percent, Swords } from "lucide-react";

interface QuickStatsProps {
  profile: Profile;
}

export function QuickStats({ profile }: QuickStatsProps) {
  const winRate =
    profile.matches_played > 0
      ? Math.round((profile.wins / profile.matches_played) * 100)
      : 0;

  const stats = [
    { label: "Played", value: profile.matches_played, icon: Swords, iconClass: "text-muted-foreground", bgClass: "bg-muted" },
    { label: "Wins", value: profile.wins, icon: Trophy, iconClass: "text-win", bgClass: "bg-win/10" },
    { label: "Goals", value: profile.goals, icon: Crosshair, iconClass: "text-draw", bgClass: "bg-draw/10" },
    { label: "Win %", value: `${winRate}`, icon: Percent, iconClass: "text-info", bgClass: "bg-info/10" },
  ];

  return (
    <section className="quick-stats px-5">
      <div className="quick-stats__grid grid grid-cols-4 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="quick-stats__item flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border shadow-card px-2 py-3"
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.bgClass}`}>
              <stat.icon size={16} className={stat.iconClass} />
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

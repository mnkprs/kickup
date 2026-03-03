import type { Profile } from "@/lib/types";
import { Crosshair, Swords, Trophy, ShieldAlert, Star } from "lucide-react";

interface ProfileStatsProps {
  profile: Profile;
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  const stats = [
    { label: "Goals", value: profile.goals, icon: Crosshair, iconClass: "text-draw", bgClass: "bg-draw/10" },
    { label: "Matches", value: profile.matches_played, icon: Swords, iconClass: "text-muted-foreground", bgClass: "bg-muted" },
    { label: "Wins", value: profile.wins, icon: Trophy, iconClass: "text-win", bgClass: "bg-win/10" },
    { label: "Cards", value: profile.yellow_cards + profile.red_cards, icon: ShieldAlert, iconClass: "text-warning", bgClass: "bg-warning/10" },
    { label: "MOTM", value: profile.man_of_match, icon: Star, iconClass: "text-draw", bgClass: "bg-draw/10" },
  ];

  return (
    <section className="profile-stats">
      <h2 className="profile-stats__title text-foreground font-semibold text-base mb-3">Season Stats</h2>
      <div className="profile-stats__grid grid grid-cols-3 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="profile-stats__item flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border shadow-card px-2 py-3"
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

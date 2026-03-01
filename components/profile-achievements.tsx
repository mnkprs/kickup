"use client";

// Static placeholder badges — replaced with real achievement system later
const achievements = [
  { id: "ach_1", name: "Top Scorer", description: "Lead the league in goals", icon: "crosshair" as const, unlocked: false },
  { id: "ach_2", name: "Playmaker", description: "10+ assists in a season", icon: "handshake" as const, unlocked: false },
  { id: "ach_3", name: "Iron Man", description: "40+ matches played", icon: "shield" as const, unlocked: false },
  { id: "ach_4", name: "Hat-trick Hero", description: "Score 3 goals in a match", icon: "flame" as const, unlocked: false },
  { id: "ach_5", name: "Clean Sheet King", description: "Win 10+ matches cleanly", icon: "lock" as const, unlocked: false },
  { id: "ach_6", name: "Century Club", description: "Score 100 career goals", icon: "trophy" as const, unlocked: false },
];

import {
  Crosshair,
  Handshake,
  Shield,
  Flame,
  Lock,
  Trophy,
} from "lucide-react";

const iconMap = {
  crosshair: Crosshair,
  handshake: Handshake,
  shield: Shield,
  flame: Flame,
  lock: Lock,
  trophy: Trophy,
};

export function ProfileAchievements() {
  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-sm">Achievements</h2>
        <span className="text-muted-foreground text-xs">
          {achievements.filter((a) => a.unlocked).length}/{achievements.length}{" "}
          unlocked
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {achievements.map((achievement) => {
          const Icon = iconMap[achievement.icon];
          return (
            <div
              key={achievement.id}
              className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition-colors ${
                achievement.unlocked
                  ? "bg-card border-border"
                  : "bg-muted/30 border-border/50 opacity-40"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  achievement.unlocked
                    ? "bg-accent/10"
                    : "bg-muted-foreground/10"
                }`}
              >
                <Icon
                  size={18}
                  className={
                    achievement.unlocked
                      ? "text-accent"
                      : "text-muted-foreground"
                  }
                />
              </div>
              <span
                className={`text-[11px] font-semibold leading-tight ${
                  achievement.unlocked
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {achievement.name}
              </span>
              <span className="text-muted-foreground text-[9px] leading-tight">
                {achievement.description}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

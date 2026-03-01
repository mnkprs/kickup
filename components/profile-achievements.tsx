"use client";

import { achievements } from "@/lib/mock-data";
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

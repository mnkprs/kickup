"use client";

import { Crosshair, Shield, Lock, Trophy } from "lucide-react";
import type { Profile } from "@/lib/types";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof ICON_MAP;
  unlocked: boolean;
}

const ICON_MAP = {
  crosshair: Crosshair,
  shield: Shield,
  lock: Lock,
  trophy: Trophy,
};

function buildAchievements(profile: Profile): Achievement[] {
  return [
    {
      id: "ach_1",
      name: "Top Scorer",
      description: "Score 20+ career goals",
      icon: "crosshair",
      unlocked: profile.goals >= 20,
    },
    {
      id: "ach_3",
      name: "Iron Man",
      description: "40+ matches played",
      icon: "shield",
      unlocked: profile.matches_played >= 40,
    },
    {
      id: "ach_5",
      name: "Clean Sheet King",
      description: "10+ clean sheets",
      icon: "lock",
      unlocked: profile.clean_sheets >= 10,
    },
    {
      id: "ach_6",
      name: "Century Club",
      description: "Score 100 career goals",
      icon: "trophy",
      unlocked: profile.goals >= 100,
    },
  ];
}

interface ProfileAchievementsProps {
  profile: Profile;
}

export function ProfileAchievements({ profile }: ProfileAchievementsProps) {
  const achievements = buildAchievements(profile);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <section className="profile-achievements">
      <div className="profile-achievements__header flex items-center justify-between mb-3">
        <h2 className="profile-achievements__title text-foreground font-semibold text-sm">Achievements</h2>
        <span className="text-muted-foreground text-xs">
          {unlockedCount}/{achievements.length} unlocked
        </span>
      </div>
      <div className="profile-achievements__grid grid grid-cols-3 gap-2.5">
        {achievements.map((achievement) => {
          const Icon = ICON_MAP[achievement.icon];
          return (
            <div
              key={achievement.id}
              className={`profile-achievements__item flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition-colors ${achievement.unlocked ? "profile-achievements__item--unlocked" : ""} ${
                achievement.unlocked
                  ? "bg-card border-border shadow-card"
                  : "bg-muted/30 border-border/50 opacity-40"
              }`}
            >
              <div
                className={`profile-achievements__item-icon h-10 w-10 rounded-xl flex items-center justify-center ${
                  achievement.unlocked ? "bg-accent/10" : "bg-muted-foreground/10"
                }`}
              >
                <Icon
                  size={18}
                  className={achievement.unlocked ? "text-accent" : "text-muted-foreground"}
                />
              </div>
              <span
                className={`profile-achievements__item-name text-[11px] font-semibold leading-tight ${
                  achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {achievement.name}
              </span>
              <span className="profile-achievements__item-desc text-muted-foreground text-[9px] leading-tight">
                {achievement.description}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

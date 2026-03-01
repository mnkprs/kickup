"use client";

import { Crosshair, Trophy, Minus, Star } from "lucide-react";
import { format, parseISO } from "date-fns";

// Static placeholder — replaced with real data once match_events are wired
const recentActivity = [
  { id: "act_1", type: "goal" as const, description: "No recent activity yet", date: new Date().toISOString().split("T")[0] },
];

const activityIcons = {
  goal: { icon: Crosshair, iconClass: "text-draw", bgClass: "bg-draw/10" },
  win: { icon: Trophy, iconClass: "text-win", bgClass: "bg-win/10" },
  draw: { icon: Minus, iconClass: "text-muted-foreground", bgClass: "bg-muted" },
  motm: { icon: Star, iconClass: "text-draw", bgClass: "bg-draw/10" },
};

export function ProfileActivity() {
  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-sm">
          Recent Activity
        </h2>
        <button className="text-accent text-xs font-medium hover:underline">
          See all
        </button>
      </div>
      <div className="rounded-xl bg-card border border-border p-4">
        {recentActivity.slice(0, 5).map((activity, i) => {
          const config = activityIcons[activity.type];
          const Icon = config.icon;
          return (
            <div
              key={activity.id}
              className={`flex items-center gap-3 py-2.5 ${
                i < 4 ? "border-b border-border" : ""
              }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${config.bgClass}`}>
                <Icon size={14} className={config.iconClass} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-foreground text-sm font-medium block truncate">
                  {activity.description}
                </span>
                <span className="text-muted-foreground text-xs">
                  {format(parseISO(activity.date), "d MMM yyyy")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

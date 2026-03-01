"use client";

import { recentActivity } from "@/lib/mock-data";
import { Crosshair, Trophy, Minus, Star } from "lucide-react";
import { format, parseISO } from "date-fns";

const activityIcons = {
  goal: { icon: Crosshair, color: "#F9A825", bg: "rgba(249,168,37,0.12)" },
  win: { icon: Trophy, color: "#2E7D32", bg: "rgba(46,125,50,0.12)" },
  draw: { icon: Minus, color: "#A3A3A3", bg: "rgba(163,163,163,0.12)" },
  motm: { icon: Star, color: "#F9A825", bg: "rgba(249,168,37,0.12)" },
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
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: config.bg }}
              >
                <Icon size={14} style={{ color: config.color }} />
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

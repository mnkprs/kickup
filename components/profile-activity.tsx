"use client";

import Link from "next/link";
import { Trophy, Minus, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Match } from "@/lib/types";

interface ProfileActivityProps {
  matches: Match[];
  teamId: string | null;
}

function getResult(match: Match, teamId: string): "win" | "draw" | "loss" | null {
  if (match.status !== "completed" || match.home_score == null || match.away_score == null) return null;
  const isHome = match.home_team_id === teamId;
  const myScore = isHome ? match.home_score : match.away_score;
  const theirScore = isHome ? match.away_score : match.home_score;
  if (myScore > theirScore) return "win";
  if (myScore === theirScore) return "draw";
  return "loss";
}

const RESULT_CONFIG = {
  win:  { icon: Trophy, iconClass: "text-win",  bgClass: "bg-win/10",  label: "W" },
  draw: { icon: Minus,  iconClass: "text-muted-foreground", bgClass: "bg-muted", label: "D" },
  loss: { icon: X,      iconClass: "text-loss", bgClass: "bg-loss/10", label: "L" },
};

export function ProfileActivity({ matches, teamId }: ProfileActivityProps) {
  const completedMatches = teamId
    ? matches
        .filter((m) => m.status === "completed" && m.home_score != null)
        .slice(0, 5)
    : [];

  return (
    <section className="px-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">Recent Activity</h2>
      <div className="rounded-xl bg-card border border-border p-4">
        {completedMatches.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No recent activity yet</p>
        ) : (
          completedMatches.map((match, i) => {
            const result = getResult(match, teamId!);
            if (!result) return null;
            const config = RESULT_CONFIG[result];
            const Icon = config.icon;
            const isHome = match.home_team_id === teamId;
            const opponent = isHome ? match.away_team.name : match.home_team.name;
            const score = `${match.home_score}–${match.away_score}`;

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className={`flex items-center gap-3 py-2.5 hover:bg-muted/30 -mx-1 px-1 rounded-lg transition-colors ${i < completedMatches.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${config.bgClass}`}>
                  <Icon size={14} className={config.iconClass} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-foreground text-sm font-medium block truncate">
                    {config.label} · {score} vs {opponent}
                  </span>
                  {match.date && (
                    <span className="text-muted-foreground text-xs">
                      {format(parseISO(match.date), "d MMM yyyy")}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

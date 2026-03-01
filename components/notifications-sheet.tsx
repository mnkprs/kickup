"use client";

import { X, CalendarClock, Trophy, Clock } from "lucide-react";
import type { Match } from "@/lib/types";
import { format, parseISO } from "date-fns";

function getResult(match: Match, teamId: string | null) {
  if (!teamId || match.home_score === null || match.away_score === null) return null;
  const isHome = match.home_team_id === teamId;
  const my = isHome ? match.home_score : match.away_score;
  const their = isHome ? match.away_score : match.home_score;
  if (my > their) return "W";
  if (my < their) return "L";
  return "D";
}

const resultColors = {
  W: "bg-win/15 text-win",
  D: "bg-draw/15 text-draw",
  L: "bg-loss/15 text-loss",
};

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
  upcomingMatches: Match[];
  recentResults: Match[];
  teamId: string | null;
}

export function NotificationsSheet({
  open,
  onClose,
  upcomingMatches,
  recentResults,
  teamId,
}: NotificationsSheetProps) {
  const nextMatch = upcomingMatches
    .filter(
      (m) => m.home_team_id === teamId || m.away_team_id === teamId
    )
    .sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime())[0];

  const recentTeamResults = recentResults
    .filter(
      (m) => m.home_team_id === teamId || m.away_team_id === teamId
    )
    .slice(0, 3);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {nextMatch && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Upcoming
              </p>
              <div className="rounded-xl bg-card border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                    <CalendarClock size={16} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {nextMatch.home_team.short_name} vs {nextMatch.away_team.short_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {nextMatch.date ? format(parseISO(nextMatch.date), "EEE, MMM d") : "TBC"}
                      {nextMatch.time ? ` at ${nextMatch.time.slice(0, 5)}` : ""}
                    </p>
                    {nextMatch.location && (
                      <p className="text-xs text-muted-foreground mt-0.5">{nextMatch.location}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {recentTeamResults.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Results
              </p>
              <div className="flex flex-col gap-2">
                {recentTeamResults.map((m) => {
                  const res = getResult(m, teamId);
                  const opponent = m.home_team_id === teamId ? m.away_team : m.home_team;
                  return (
                    <div
                      key={m.id}
                      className="rounded-xl bg-card border border-border p-4 flex items-center gap-3"
                    >
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Trophy size={16} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {m.home_team.short_name} {m.home_score} - {m.away_score}{" "}
                          {m.away_team.short_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.date ? format(parseISO(m.date), "MMM d") : ""}{" "}
                          {m.location ? `— ${m.location}` : ""}
                        </p>
                      </div>
                      {res && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${resultColors[res as keyof typeof resultColors]}`}>
                          {res}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {recentTeamResults.length === 0 && !nextMatch && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock size={32} className="mb-3 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

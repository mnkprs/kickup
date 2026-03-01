"use client";

import { useState } from "react";
import { X, CalendarClock, Trophy, Clock } from "lucide-react";
import { matches, teams } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";

const MY_TEAM_ID = "team_001";

function getResult(homeId: string, hs: number, as: number) {
  const isHome = homeId === MY_TEAM_ID;
  const my = isHome ? hs : as;
  const their = isHome ? as : hs;
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
}

export function NotificationsSheet({ open, onClose }: NotificationsSheetProps) {
  const nextMatch = matches
    .filter(
      (m) =>
        m.status === "upcoming" &&
        (m.home_team.id === MY_TEAM_ID || m.away_team.id === MY_TEAM_ID)
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const recentResults = matches
    .filter(
      (m) =>
        m.status === "completed" &&
        (m.home_team.id === MY_TEAM_ID || m.away_team.id === MY_TEAM_ID)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Upcoming match reminder */}
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
                      {nextMatch.home_team.short_name} vs{" "}
                      {nextMatch.away_team.short_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(nextMatch.date), "EEE, MMM d")} at{" "}
                      {nextMatch.time}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {nextMatch.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent results */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Results
            </p>
            <div className="flex flex-col gap-2">
              {recentResults.map((m) => {
                const res = getResult(
                  m.home_team.id,
                  m.home_score!,
                  m.away_score!
                );
                const opponent =
                  m.home_team.id === MY_TEAM_ID
                    ? m.away_team
                    : m.home_team;
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
                        {format(parseISO(m.date), "MMM d")} -- {m.location}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${resultColors[res]}`}
                    >
                      {res}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {recentResults.length === 0 && !nextMatch && (
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

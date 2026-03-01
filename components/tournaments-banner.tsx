"use client";

import { tournaments } from "@/lib/mock-data";
import { Trophy, Calendar, Users, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";

export function TournamentsBanner() {
  const activeTournament = tournaments.find((t) => t.status === "in_progress");
  const upcomingTournament = tournaments.find((t) => t.status === "upcoming");

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-base">Tournaments</h2>
        <Link
          href="/tournaments"
          className="text-accent text-xs font-medium hover:underline"
        >
          Browse
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {/* Active Tournament */}
        {activeTournament && (
          <Link
            href="/tournaments"
            className="rounded-xl p-4 group transition-all hover:shadow-lg block"
            style={{
              background: "linear-gradient(135deg, #1B5E20, #2E7D32)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-draw" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground/70">
                  Live
                </span>
              </div>
              <ChevronRight
                size={16}
                className="text-accent-foreground/50 group-hover:text-accent-foreground transition-colors"
              />
            </div>
            <h3 className="text-accent-foreground font-semibold text-sm mb-2">
              {activeTournament.name}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-accent-foreground/60" />
                <span className="text-accent-foreground/60 text-xs">
                  {format(parseISO(activeTournament.start_date), "d MMM")} -{" "}
                  {format(parseISO(activeTournament.end_date), "d MMM")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={12} className="text-accent-foreground/60" />
                <span className="text-accent-foreground/60 text-xs">
                  {activeTournament.teams_count} teams
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Upcoming Tournament */}
        {upcomingTournament && (
          <Link
            href="/tournaments"
            className="rounded-xl bg-card border border-border p-4 group hover:border-accent/40 transition-colors block"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-draw bg-draw/15 px-2 py-0.5 rounded-full">
                    Upcoming
                  </span>
                </div>
                <h3 className="text-foreground font-medium text-sm mb-1">
                  {upcomingTournament.name}
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-xs">
                    Starts{" "}
                    {format(
                      parseISO(upcomingTournament.start_date),
                      "d MMM yyyy"
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {upcomingTournament.teams_count} teams
                  </span>
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
              />
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}

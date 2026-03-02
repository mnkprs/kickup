"use client";

import { useState, useMemo } from "react";
import type { Team } from "@/lib/types";
import {
  ArrowLeft,
  Search,
  Users,
  MapPin,
  ChevronRight,
  Trophy,
  UserPlus,
  Swords,
} from "lucide-react";
import Link from "next/link";
import { NotificationsButton } from "@/components/notifications-button";

const filters = ["All", "My Team", "Open", "vs Ready"];

function getTeamRecord(team: Team) {
  return {
    total: team.wins + team.draws + team.losses,
    w: team.wins,
    d: team.draws,
    l: team.losses,
  };
}

interface TeamsListClientProps {
  teams: Team[];
  userTeamId: string | null | undefined;
}

export function TeamsListClient({ teams, userTeamId }: TeamsListClientProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() => {
    let result = teams;

    if (activeFilter === "My Team") {
      result = result.filter((t) => t.id === userTeamId);
    } else if (activeFilter === "Open") {
      result = result.filter((t) => t.open_spots > 0);
    } else if (activeFilter === "vs Ready") {
      result = result.filter((t) => t.searching_for_opponent);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.short_name.toLowerCase().includes(q) ||
          t.area.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, activeFilter, teams, userTeamId]);

  return (
    <>
      {/* Header */}
      <header className="px-5 pt-12 pb-2">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
            >
              <ArrowLeft size={18} className="text-muted-foreground" />
            </Link>
            <h1 className="text-foreground font-semibold text-lg">Teams</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsButton />
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
            >
              <Search size={18} className="text-muted-foreground" />
            </button>
            {!userTeamId && (
              <Link
                href="/teams/create"
                className="h-10 w-10 rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <UserPlus size={18} className="text-accent-foreground" />
              </Link>
            )}
          </div>
        </div>

        {showSearch && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search teams..."
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-card border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        )}

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </header>

      {/* Team cards */}
      <main className="px-5 flex flex-col gap-3 pb-24">
        {filtered.map((team) => {
          const record = getTeamRecord(team);
          const isMyTeam = team.id === userTeamId;
          const winRate =
            record.total > 0 ? Math.round((team.wins / record.total) * 100) : 0;

          return (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <div
                className={`rounded-xl bg-card border border-border shadow-card p-4 cursor-pointer group hover:border-accent/40 transition-colors ${
                  isMyTeam ? "border-accent/30" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                      isMyTeam
                        ? "bg-accent/15 ring-2 ring-accent/30"
                        : "bg-muted"
                    }`}
                  >
                    <span
                      className={`font-bold text-sm ${
                        isMyTeam ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {team.short_name}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-foreground font-semibold text-sm truncate">
                        {team.name}
                      </h3>
                      {isMyTeam && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">
                          My team
                        </span>
                      )}
                      {team.searching_for_opponent && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-win bg-win/10 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                          <Swords size={9} />
                          vs
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-muted-foreground text-xs">
                        <MapPin size={11} />
                        {team.area}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    size={16}
                    className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                  />
                </div>

                {/* Record + Win rate */}
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-bold text-win">{team.wins}</span>W
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-bold text-draw">{team.draws}</span>D
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-bold text-loss">{team.losses}</span>L
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2.5">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${winRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Trophy size={11} className="text-draw" />
                    <span className="text-draw text-[11px] font-medium">
                      {record.total} played
                    </span>
                  </div>
                  {team.open_spots > 0 && (
                    <span className="flex items-center gap-1 text-accent text-[11px] font-medium">
                      <UserPlus size={11} />
                      {team.open_spots} open spots
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Users size={20} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No teams found</p>
          </div>
        )}
      </main>

    </>
  );
}

"use client";

import { currentUser, teams } from "@/lib/mock-data";
import { Settings, Share2, MapPin, Calendar, Crown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";

export function ProfileHeader() {
  const initials = currentUser.full_name
    .split(" ")
    .map((n) => n[0])
    .join("");
  const team = teams.find((t) => t.id === currentUser.team_id);
  const winRate =
    currentUser.matches_played > 0
      ? Math.round((currentUser.wins / currentUser.matches_played) * 100)
      : 0;
  const isCaptain = team?.captain_id === currentUser.id;

  return (
    <header className="px-5 pt-12 pb-2">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-foreground font-semibold text-base">Profile</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            aria-label="Share profile"
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
          >
            <Share2 size={18} className="text-muted-foreground" />
          </button>
          <button
            aria-label="Settings"
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
          >
            <Settings size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-3 mb-5">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center ring-4 ring-accent/20">
            <span className="text-accent-foreground font-bold text-xl">
              {initials}
            </span>
          </div>
          {/* Online dot */}
          <span
            aria-label="Online"
            className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-win border-2 border-background"
          />
          {/* Win rate badge */}
          <span className="absolute -top-1 -right-2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {winRate}%
          </span>
        </div>

        <div className="text-center">
          <h2 className="text-foreground font-bold text-xl leading-tight">
            {currentUser.full_name}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
              {currentUser.position}
            </span>
            {isCaptain && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-draw">
                <Crown size={10} fill="currentColor" />
                Captain
              </span>
            )}
            {team && (
              <span className="text-xs text-muted-foreground">
                {team.name}
              </span>
            )}
          </div>
          {currentUser.bio && (
            <p className="text-muted-foreground text-xs mt-2 max-w-[240px] mx-auto leading-relaxed">
              {currentUser.bio}
            </p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-muted-foreground" />
          <span className="text-muted-foreground text-xs">{currentUser.area}</span>
        </div>
        {currentUser.joined_date && (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-muted-foreground" />
            <span className="text-muted-foreground text-xs">
              Joined {format(parseISO(currentUser.joined_date), "MMM yyyy")}
            </span>
          </div>
        )}
      </div>

      {/* W/D/L record card */}
      <div className="rounded-xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-muted-foreground text-xs font-medium">Win Rate</span>
          <span className="text-foreground font-bold text-sm">{winRate}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-2.5">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${winRate}%` }}
          />
        </div>
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-win font-bold text-base leading-none">{currentUser.wins}</span>
            <span className="text-muted-foreground text-[10px]">Won</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-draw font-bold text-base leading-none">{currentUser.draws}</span>
            <span className="text-muted-foreground text-[10px]">Drawn</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-loss font-bold text-base leading-none">{currentUser.losses}</span>
            <span className="text-muted-foreground text-[10px]">Lost</span>
          </div>
        </div>
      </div>
    </header>
  );
}

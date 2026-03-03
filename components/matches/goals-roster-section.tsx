"use client";

import { Minus, Plus, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { UNKNOWN_PLAYER_ID } from "@/lib/constants";
import { PlayerSearchSelect, type PlayerSearchResult } from "@/components/find-players/player-search-select";
import type { Match } from "@/lib/types";
import type { RosterPlayer } from "./match-detail-types";

interface GoalsRosterSectionProps {
  roster: RosterPlayer[];
  guests?: RosterPlayer[];
  team: Match["home_team"];
  goals: Record<string, number>;
  onUpdate: (playerId: string, delta: number) => void;
  onAddGuest?: (player: RosterPlayer) => void;
  onRemoveGuest?: (playerId: string) => void;
  showUnknown?: boolean;
}

export function GoalsRosterSection({
  roster,
  guests = [],
  team,
  goals,
  onUpdate,
  onAddGuest,
  onRemoveGuest,
  showUnknown = false,
}: GoalsRosterSectionProps) {
  const rosterAndGuestIds = new Set([
    ...roster.map((p) => p.player_id),
    ...guests.map((p) => p.player_id),
  ]);

  return (
    <div className="goals-roster-section rounded-xl bg-card border border-border shadow-card overflow-hidden">
      <div className="goals-roster-section__header flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
        <TeamAvatar
          avatar_url={team.avatar_url}
          emoji={team.emoji}
          short_name={team.short_name}
          name={team.name}
          color={team.color}
          size="2xs"
        />
        <span className="text-xs font-semibold text-foreground">{team.name}</span>
      </div>
      <div className="divide-y divide-border">
        {roster.map(({ player_id, profile }) => {
          const count = goals[player_id] ?? 0;
          const name = (profile.full_name as string) ?? "Unknown";
          return (
            <div
              key={player_id}
              className="flex items-center gap-2 px-4 py-2.5"
            >
              <button
                type="button"
                onClick={() => onUpdate(player_id, -1)}
                disabled={count <= 0}
                className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors pressable shrink-0"
                aria-label={`Remove goal from ${name}`}
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <Avatar
                avatar_url={profile.avatar_url as string | null}
                avatar_initials={(profile.avatar_initials as string) || name.split(" ").map((n) => n[0]).join("")}
                avatar_color={(profile.avatar_color as string) ?? "#2E7D32"}
                full_name={name}
                size="2xs"
              />
              <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                {name}
              </span>
              <span className="text-sm font-bold text-draw tabular-nums w-6 text-center shrink-0">
                {count}
              </span>
              <button
                type="button"
                onClick={() => onUpdate(player_id, 1)}
                className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors pressable shrink-0"
                aria-label={`Add goal for ${name}`}
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          );
        })}
        {onAddGuest && onRemoveGuest && (
          <>
            {guests.map(({ player_id, profile }) => {
              const count = goals[player_id] ?? 0;
              const name = (profile.full_name as string) ?? "Unknown";
              return (
                <div
                  key={player_id}
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted/10"
                >
                  <button
                    type="button"
                    onClick={() => onUpdate(player_id, -1)}
                    disabled={count <= 0}
                    className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors pressable shrink-0"
                    aria-label={`Remove goal from ${name}`}
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <Avatar
                    avatar_url={profile.avatar_url as string | null}
                    avatar_initials={(profile.avatar_initials as string) || name.split(" ").map((n) => n[0]).join("")}
                    avatar_color={(profile.avatar_color as string) ?? "#2E7D32"}
                    full_name={name}
                    size="2xs"
                  />
                  <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                    {name}
                    <span className="text-muted-foreground text-xs ml-1">(guest)</span>
                  </span>
                  <span className="text-sm font-bold text-draw tabular-nums w-6 text-center shrink-0">
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdate(player_id, 1)}
                    className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors pressable shrink-0"
                    aria-label={`Add goal for ${name}`}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveGuest(player_id)}
                    className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-destructive transition-colors pressable shrink-0"
                    aria-label={`Remove guest ${name}`}
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}
            <div className="px-4 py-2 bg-muted/20 border-t border-border">
              <PlayerSearchSelect
                onSelect={(p: PlayerSearchResult) =>
                  onAddGuest({
                    player_id: p.id,
                    profile: {
                      full_name: p.full_name,
                      avatar_initials: p.avatar_initials,
                      avatar_color: p.avatar_color,
                      avatar_url: p.avatar_url,
                    },
                  })
                }
                excludeIds={rosterAndGuestIds}
                placeholder="Add guest player..."
                popoverPlacement="top"
                borderless
              />
            </div>
          </>
        )}
        {showUnknown && (
          <div className="flex items-center gap-2 px-4 py-2.5">
            <button
              type="button"
              onClick={() => onUpdate(UNKNOWN_PLAYER_ID, -1)}
              disabled={(goals[UNKNOWN_PLAYER_ID] ?? 0) <= 0}
              className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors pressable shrink-0"
              aria-label="Remove goal from Unknown"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <Avatar
              avatar_url={null}
              avatar_initials="?"
              avatar_color="#9E9E9E"
              full_name="Unknown"
              size="2xs"
            />
            <span className="text-sm font-medium text-muted-foreground truncate flex-1 min-w-0">
              Unknown (non-registered)
            </span>
            <span className="text-sm font-bold text-draw tabular-nums w-6 text-center shrink-0">
              {goals[UNKNOWN_PLAYER_ID] ?? 0}
            </span>
            <button
              type="button"
              onClick={() => onUpdate(UNKNOWN_PLAYER_ID, 1)}
              className="h-8 w-8 rounded-full flex items-center justify-center border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors pressable shrink-0"
              aria-label="Add goal for Unknown"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Profile, AreaGroup } from "@/lib/types";
import { parseISO } from "date-fns";
import {
  Search,
  UserPlus,
  MapPin,
  Crosshair,
  Shield,
  Ruler,
  Cake,
  Footprints,
} from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { NotificationsButton } from "@/components/notifications/notifications-button";
import { Avatar } from "@/components/ui/avatar";
import { AreaGroupSelect } from "@/components/ui/area-group-select";
import { invitePlayerToTeamAction } from "@/app/actions/teams";

const POSITIONS = ["All", "GK", "DEF", "MID", "FWD"] as const;
const LOOKING_FILTERS = ["All", "Looking"] as const;

function isLookingForTeam(p: Profile): boolean {
  if (!p.is_freelancer) return false;
  const until = p.freelancer_until;
  if (!until) return true;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const pastNoon = now.getHours() >= 12;
  if (until > today) return true;
  if (until === today && !pastNoon) return true;
  return false;
}

function parsePosition(param: string | null): (typeof POSITIONS)[number] {
  if (param === "GK" || param === "DEF" || param === "MID" || param === "FWD") return param;
  return "All";
}

function parseLooking(param: string | null): (typeof LOOKING_FILTERS)[number] {
  return param === "Looking" ? "Looking" : "All";
}

function getAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  try {
    const dob = parseISO(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  } catch {
    return null;
  }
}

function formatFoot(foot: string | null | undefined): string {
  if (!foot) return "";
  if (foot === "both") return "Both";
  return foot.charAt(0).toUpperCase() + foot.slice(1);
}

interface FindPlayersClientProps {
  players: Profile[];
  captainTeamId: string | null;
  currentUserId: string | null;
  areaGroups: AreaGroup[];
}

export function FindPlayersClient({
  players,
  captainTeamId,
  currentUserId,
  areaGroups,
}: FindPlayersClientProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [positionFilter, setPositionFilterState] = useState<typeof POSITIONS[number]>(() =>
    parsePosition(searchParams.get("position"))
  );
  const [lookingFilter, setLookingFilterState] = useState<typeof LOOKING_FILTERS[number]>(() =>
    parseLooking(searchParams.get("looking"))
  );
  const [areaFilter, setAreaFilterState] = useState<string>(() =>
    searchParams.get("area") ?? ""
  );

  const setPositionFilter = useCallback((next: string) => {
    setPositionFilterState(next as (typeof POSITIONS)[number]);
    const params = new URLSearchParams(window.location.search);
    if (next !== "All") params.set("position", next);
    else params.delete("position");
    window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  }, []);

  const setLookingFilter = useCallback((next: string) => {
    setLookingFilterState(next as (typeof LOOKING_FILTERS)[number]);
    const params = new URLSearchParams(window.location.search);
    if (next !== "All") params.set("looking", next);
    else params.delete("looking");
    window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  }, []);

  const setAreaFilter = useCallback((next: string) => {
    setAreaFilterState(next);
    const params = new URLSearchParams(window.location.search);
    if (next) params.set("area", next);
    else params.delete("area");
    window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  }, []);

  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      setPositionFilterState(parsePosition(params.get("position")));
      setLookingFilterState(parseLooking(params.get("looking")));
      setAreaFilterState(params.get("area") ?? "");
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const filtered = useMemo(() => {
    let result = players;

    if (positionFilter !== "All") {
      result = result.filter((p) => p.position === positionFilter);
    }
    if (lookingFilter === "Looking") {
      result = result.filter(isLookingForTeam);
    }
    if (areaFilter) {
      result = result.filter((p) => p.area && p.area.toLowerCase() === areaFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          (p.position?.toLowerCase().includes(q) ?? false) ||
          (p.area?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [players, positionFilter, lookingFilter, areaFilter, search]);

  const canInvite = !!captainTeamId && !!currentUserId;

  async function handleInvite(playerId: string) {
    if (playerId === currentUserId) return;
    setInvitingId(playerId);
    setInviteError(null);
    const result = await invitePlayerToTeamAction(playerId);
    setInvitingId(null);
    if (result.error) {
      setInviteError(result.error);
      return;
    }
  }

  return (
    <>
      <header className="find-players-header px-5 pt-12 pb-2">
        <div className="find-players-header__top flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-foreground font-semibold text-lg">Find Players</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsButton />
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
            >
              <Search size={18} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4">
          Browse all players. Those looking for a team appear first. {canInvite ? "Invite them or apply to teams." : "Apply to teams with open spots."}
        </p>

        {showSearch && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, position, area..."
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-card border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        )}

        {/* Position filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {POSITIONS.map((pos) => {
            const isActive = positionFilter === pos;
            return (
              <button
                key={pos}
                onClick={() => setPositionFilter(pos)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>

        {/* Looking + Area filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {LOOKING_FILTERS.map((opt) => {
            const isActive = lookingFilter === opt;
            return (
              <button
                key={opt}
                onClick={() => setLookingFilter(opt)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt}
              </button>
            );
          })}
          <div className="shrink-0 min-w-[140px] max-w-[200px]">
            <AreaGroupSelect
              areaGroups={areaGroups}
              value={areaFilter}
              onChange={setAreaFilter}
              placeholder="All areas"
              emptyOptionLabel="All areas"
            />
          </div>
        </div>
      </header>

      <main className="find-players__main px-5 flex flex-col gap-3 pb-24">
        {inviteError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {inviteError}
          </div>
        )}

        {filtered.map((player) => {
          const isSelf = player.id === currentUserId;
          const playerLooking = isLookingForTeam(player);
          const age = getAge(player.date_of_birth);

          return (
            <div
              key={player.id}
              className="find-players__player-card rounded-xl bg-card border border-border shadow-card p-4"
            >
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${player.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <Avatar
                    avatar_url={player.avatar_url}
                    avatar_initials={player.avatar_initials}
                    avatar_color={player.avatar_color}
                    full_name={player.full_name}
                    size="lg"
                    colorOpacity="30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-foreground font-semibold text-sm truncate">
                        {player.full_name}
                      </h3>
                      {isSelf && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">
                          You
                        </span>
                      )}
                      {playerLooking && (
                        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full shrink-0">
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
                          </span>
                          Looking
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {player.position && (
                        <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          {player.position}
                        </span>
                      )}
                      {player.area && (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <MapPin size={11} />
                          {player.area}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {canInvite && !isSelf && (
                  <button
                    onClick={() => handleInvite(player.id)}
                    disabled={!!invitingId}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 pressable"
                  >
                    {invitingId === player.id ? (
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={14} />
                        Invite
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-2 shrink-0">
                  <span title="Matches">{player.matches_played} matches</span>
                  {player.position === "GK" ? (
                    <span title="Avg goals against per match">
                      <Shield size={11} className="inline mr-0.5 text-muted-foreground" />
                      {player.matches_played > 0
                        ? `${(player.goals_against / player.matches_played).toFixed(1)} GA`
                        : "—"}
                    </span>
                  ) : (
                    <span title="Goals">
                      <Crosshair size={11} className="inline mr-0.5 text-draw" />
                      {player.goals}G
                    </span>
                  )}
                  <span title="Win rate">
                    {player.matches_played > 0
                      ? `${Math.round((player.wins / player.matches_played) * 100)}% win`
                      : "—"}
                  </span>
                </div>
                {(player.height != null || age != null || !!player.preferred_foot) && (
                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                    {player.height != null && (
                      <span title="Height" className="flex items-center gap-1">
                        <Ruler size={11} />
                        {player.height} cm
                      </span>
                    )}
                    {age != null && (
                      <span title="Age" className="flex items-center gap-1">
                        <Cake size={11} />
                        {age}y
                      </span>
                    )}
                    {player.preferred_foot && (
                      <span title="Preferred foot" className="flex items-center gap-1">
                        <Footprints size={11} />
                        {formatFoot(player.preferred_foot)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <UserPlus size={20} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              {players.length === 0
                ? "No players yet."
                : "No players match your filters"}
            </p>
            {!currentUserId && (
              <p className="text-muted-foreground text-xs">
                Sign in to toggle &quot;Looking for team&quot; and apply to teams.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import type { Profile } from "@/lib/types";
import {
  ArrowLeft,
  Search,
  UserPlus,
  MapPin,
  ChevronRight,
  Crosshair,
} from "lucide-react";
import Link from "next/link";
import { NotificationsButton } from "@/components/notifications-button";
import { invitePlayerToTeamAction } from "@/app/actions/teams";
interface FindPlayersClientProps {
  freelancers: Profile[];
  captainTeamId: string | null;
  currentUserId: string | null;
}

export function FindPlayersClient({
  freelancers,
  captainTeamId,
  currentUserId,
}: FindPlayersClientProps) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return freelancers;
    const q = search.toLowerCase();
    return freelancers.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.position?.toLowerCase().includes(q) ?? false) ||
        (p.area?.toLowerCase().includes(q) ?? false)
    );
  }, [search, freelancers]);

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
      <header className="px-5 pt-12 pb-2">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
            >
              <ArrowLeft size={18} className="text-muted-foreground" />
            </Link>
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
          Players looking for a team. {canInvite ? "Invite them to your team or apply to teams." : "Apply to teams with open spots."}
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
      </header>

      <main className="px-5 flex flex-col gap-3 pb-24">
        {inviteError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {inviteError}
          </div>
        )}

        {filtered.map((player) => {
          const initials = player.avatar_initials || player.full_name.split(" ").map((n) => n[0]).join("");
          const isSelf = player.id === currentUserId;

          return (
            <div
              key={player.id}
              className="rounded-xl bg-card border border-border shadow-card p-4"
            >
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${player.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${player.avatar_color}30` }}
                  >
                    <span className="text-foreground font-bold text-sm">
                      {initials}
                    </span>
                  </div>
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
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground shrink-0"
                  />
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

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <span title="Goals">
                  <Crosshair size={11} className="inline mr-0.5 text-draw" />
                  {player.goals}G
                </span>
                <span>{player.matches_played} matches</span>
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
              {freelancers.length === 0
                ? "No players looking for a team yet. Enable &quot;Find a Team&quot; in your profile settings to appear here."
                : "No players match your search"}
            </p>
            {!currentUserId && (
              <p className="text-muted-foreground text-xs">
                Sign in to see freelancers and apply to teams.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}

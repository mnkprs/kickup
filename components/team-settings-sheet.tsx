"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, LogOut, Loader2 } from "lucide-react";
import {
  toggleSearchingForOpponentAction,
  setTeamSearchingForPlayersAction,
  deleteTeamAction,
  leaveTeamAction,
} from "@/app/actions/teams";
import { LiveDot } from "@/components/live-dot";
import { TeamAvatarUpload } from "@/components/team-avatar-upload";
import { ConfirmModal } from "@/components/confirm-modal";
import type { Team } from "@/lib/types";

interface TeamSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  team: Team;
  searchingForOpponent: boolean;
  searchingForPlayers: boolean;
  isCaptain: boolean;
}

export function TeamSettingsSheet({
  open,
  onClose,
  team,
  searchingForOpponent: initialSearchingOpponent,
  searchingForPlayers: initialSearchingPlayers,
  isCaptain,
}: TeamSettingsSheetProps) {
  const teamId = team.id;
  const router = useRouter();
  const [searchingOpponent, setSearchingOpponent] = useState(initialSearchingOpponent);
  const [searchingPlayers, setSearchingPlayers] = useState(initialSearchingPlayers);
  const [loadingOpponent, setLoadingOpponent] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function handleToggleOpponent() {
    setLoadingOpponent(true);
    const next = !searchingOpponent;
    const result = await toggleSearchingForOpponentAction(teamId, next);
    setLoadingOpponent(false);
    if (!result.error) {
      setSearchingOpponent(next);
      router.refresh();
    }
  }

  async function handleTogglePlayers() {
    setLoadingPlayers(true);
    const next = !searchingPlayers;
    const result = await setTeamSearchingForPlayersAction(teamId, next);
    setLoadingPlayers(false);
    if (!result.error) {
      setSearchingPlayers(next);
      router.refresh();
    }
  }

  async function handleLeave() {
    setLeaving(true);
    const result = await leaveTeamAction(teamId);
    setLeaving(false);
    if (!result?.error) {
      setLeaveModalOpen(false);
      onClose();
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    setDeleting(true);
    await deleteTeamAction(teamId);
    onClose();
    setDeleting(false);
  }

  const leaveMessage = isCaptain
    ? `Leave ${team.name}? If you're the only member, the team will be deleted. Otherwise, another player will become captain.`
    : `Leave ${team.name}? You can request to join again later.`;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Team settings</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors pressable"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
          {isCaptain && (
            <>
              <section>
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Team avatar
                </h3>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                  <TeamAvatarUpload team={team} size="lg" editable />
                  <div className="min-w-0">
                    <p className="text-foreground font-semibold text-sm truncate">{team.name}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Tap to upload a team logo. Visible everywhere in the app.
                    </p>
                  </div>
                </div>
              </section>

              <section>
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              Team status
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleToggleOpponent}
                disabled={loadingOpponent}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all border disabled:opacity-50 pressable ${
                  searchingOpponent
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {searchingOpponent && <LiveDot className="shrink-0" />}
                <span className="flex-1 text-left">
                  {searchingOpponent ? "Looking for Opponent" : "Find an Opponent"}
                </span>
              </button>
              <button
                onClick={handleTogglePlayers}
                disabled={loadingPlayers}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all border disabled:opacity-50 pressable ${
                  searchingPlayers
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {searchingPlayers && <LiveDot className="shrink-0" />}
                <span className="flex-1 text-left">
                  {searchingPlayers ? "Looking for Players" : "Find Players"}
                </span>
              </button>
            </div>
          </section>
            </>
          )}

          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
              Danger zone
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setLeaveModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-loss hover:bg-loss/5 border border-border hover:border-loss/30 transition-colors pressable"
              >
                <LogOut size={16} />
                Leave team
              </button>
              {isCaptain && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold bg-loss/10 text-loss border border-loss/20 hover:bg-loss/20 transition-colors disabled:opacity-50 pressable"
                >
                  {deleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete team
                </button>
              )}
            </div>
            <ConfirmModal
              open={leaveModalOpen}
              onClose={() => setLeaveModalOpen(false)}
              title="Leave team"
              message={leaveMessage}
              buttons={{ confirmLabel: "Leave", variant: "destructive" }}
              loading={leaving}
              onConfirm={handleLeave}
            />
          </section>
        </div>
      </div>
    </>
  );
}

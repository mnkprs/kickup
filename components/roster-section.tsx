"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Crosshair, UserMinus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { removeMemberAction, assignTeamCaptainAction } from "@/app/actions/teams";
import { ConfirmModal } from "@/components/confirm-modal";
import type { Profile } from "@/lib/types";

const positionOrder: Record<string, number> = {
  GK: 0, CB: 1, LB: 2, RB: 3, CDM: 4, CM: 5, CAM: 6,
  LW: 7, RW: 8, LM: 9, RM: 10, CF: 11, ST: 12,
};

const positionCategory: Record<string, string> = {
  GK: "Goalkeepers",
  CB: "Defenders", LB: "Defenders", RB: "Defenders", DEF: "Defenders",
  CDM: "Midfielders", CM: "Midfielders", CAM: "Midfielders",
  LW: "Midfielders", RW: "Midfielders", LM: "Midfielders", RM: "Midfielders", MID: "Midfielders",
  CF: "Forwards", ST: "Forwards", FWD: "Forwards",
};

const categoryOrder = ["Goalkeepers", "Defenders", "Midfielders", "Forwards", "Other"];

function posSort(a: Profile, b: Profile) {
  const pa = positionOrder[a.position ?? ""] ?? 99;
  const pb = positionOrder[b.position ?? ""] ?? 99;
  return pa - pb;
}

function getCategory(position: string | null): string {
  return position ? (positionCategory[position] ?? "Other") : "Other";
}

interface RosterSectionProps {
  members: Profile[];
  captainId: string | null | undefined;
  isCaptain: boolean;
  myPlayerId: string | undefined;
  teamId: string;
}

export function RosterSection({
  members,
  captainId,
  isCaptain,
  myPlayerId,
  teamId,
}: RosterSectionProps) {
  const router = useRouter();
  const roster = [...members].sort(posSort);
  const byCategory = useMemo(() => {
    const groups: Record<string, Profile[]> = {};
    for (const p of roster) {
      const cat = getCategory(p.position);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return categoryOrder
      .filter((c) => groups[c]?.length)
      .map((c) => ({ category: c, players: groups[c] }));
  }, [roster]);
  const [pendingRemove, setPendingRemove] = useState<{
    playerId: string;
    playerName: string;
  } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [pendingMakeCaptain, setPendingMakeCaptain] = useState<{
    playerId: string;
    playerName: string;
  } | null>(null);
  const [assigning, setAssigning] = useState(false);

  function handleRemoveClick(e: React.MouseEvent, playerId: string, playerName: string) {
    e.preventDefault();
    e.stopPropagation();
    setPendingRemove({ playerId, playerName });
  }

  async function handleConfirmRemove() {
    if (!pendingRemove) return;
    setRemoving(true);
    const result = await removeMemberAction(teamId, pendingRemove.playerId);
    setRemoving(false);
    setPendingRemove(null);
    if (result.success) router.refresh();
  }

  function handleMakeCaptainClick(e: React.MouseEvent, playerId: string, playerName: string) {
    e.preventDefault();
    e.stopPropagation();
    setPendingMakeCaptain({ playerId, playerName });
  }

  async function handleConfirmMakeCaptain() {
    if (!pendingMakeCaptain) return;
    setAssigning(true);
    const result = await assignTeamCaptainAction(teamId, pendingMakeCaptain.playerId);
    setAssigning(false);
    setPendingMakeCaptain(null);
    if (result.success) router.refresh();
  }

  return (
    <>
      <ConfirmModal
        open={!!pendingRemove}
        onClose={() => setPendingRemove(null)}
        title="Remove player"
        message={
          pendingRemove
            ? `Remove ${pendingRemove.playerName} from the team? They will need to request to join again.`
            : ""
        }
        buttons={{ confirmLabel: "Remove", variant: "destructive" }}
        loading={removing}
        onConfirm={handleConfirmRemove}
      />
      <ConfirmModal
        open={!!pendingMakeCaptain}
        onClose={() => setPendingMakeCaptain(null)}
        title="Transfer captaincy"
        message={
          pendingMakeCaptain
            ? `Make ${pendingMakeCaptain.playerName} the new captain? You will become a regular player.`
            : ""
        }
        buttons={{ confirmLabel: "Transfer" }}
        loading={assigning}
        onConfirm={handleConfirmMakeCaptain}
      />
    <section className="roster-section px-5">
      <div className="roster-section__header flex items-center justify-between mb-3">
        <h2 className="roster-section__title text-foreground font-semibold text-sm">Roster</h2>
        <span className="text-muted-foreground text-xs">{roster.length} players</span>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
        {byCategory.map(({ category, players }) => (
          <div key={category}>
            <div className="px-4 py-2 bg-muted/50 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
              {category}
            </div>
            <div className="divide-y divide-border">
              {players.map((player) => {
                const isPlayerCaptain = captainId === player.id;
                const isMe = player.id === myPlayerId;
                const canRemove = isCaptain && !isPlayerCaptain && !isMe;
                const canMakeCaptain = isCaptain && !isPlayerCaptain;
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <Link
                      href={`/profile/${player.id}`}
                      className="flex flex-1 items-center gap-3 min-w-0"
                    >
                      <Avatar
                        avatar_url={player.avatar_url}
                        avatar_initials={player.avatar_initials}
                        avatar_color={player.avatar_color}
                        full_name={player.full_name}
                        size="sm"
                        colorOpacity="20"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground text-sm font-medium truncate">{player.full_name}</span>
                          {isPlayerCaptain && (
                            <Crown size={11} className="text-draw shrink-0" fill="currentColor" />
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">{player.position ?? "N/A"}</span>
                      </div>
                      <span title="Goals" className="shrink-0 text-xs text-muted-foreground flex items-center gap-0.5">
                        <Crosshair size={11} className="text-draw" />
                        {player.goals}
                      </span>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      {canMakeCaptain && (
                        <button
                          onClick={(e) => handleMakeCaptainClick(e, player.id, player.full_name)}
                          className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent/10 transition-colors"
                          title="Make captain"
                        >
                          <Crown size={14} className="text-muted-foreground hover:text-accent" />
                        </button>
                      )}
                      {canRemove && (
                        <button
                          onClick={(e) => handleRemoveClick(e, player.id, player.full_name)}
                          className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-loss/10 transition-colors"
                          title="Remove from team"
                        >
                          <UserMinus size={14} className="text-muted-foreground hover:text-loss" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
    </>
  );
}

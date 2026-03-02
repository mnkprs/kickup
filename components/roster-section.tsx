"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Crosshair, ShieldAlert, UserMinus } from "lucide-react";
import { removeMemberAction } from "@/app/actions/teams";
import { ConfirmModal } from "@/components/confirm-modal";
import type { Profile } from "@/lib/types";

const positionOrder: Record<string, number> = {
  GK: 0, CB: 1, LB: 2, RB: 3, CDM: 4, CM: 5, CAM: 6,
  LW: 7, RW: 8, LM: 9, RM: 10, CF: 11, ST: 12,
};

function posSort(a: Profile, b: Profile) {
  const pa = positionOrder[a.position ?? ""] ?? 99;
  const pb = positionOrder[b.position ?? ""] ?? 99;
  return pa - pb;
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
  const [pendingRemove, setPendingRemove] = useState<{
    playerId: string;
    playerName: string;
  } | null>(null);
  const [removing, setRemoving] = useState(false);

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
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-sm">Roster</h2>
        <span className="text-muted-foreground text-xs">{roster.length} players</span>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card divide-y divide-border">
        {roster.map((player) => {
          const isPlayerCaptain = captainId === player.id;
          const isMe = player.id === myPlayerId;
          const canRemove = isCaptain && !isPlayerCaptain && !isMe;
          const initials = player.avatar_initials || player.full_name.split(" ").map((n) => n[0]).join("");
          return (
            <div
              key={player.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg pressable"
            >
              <Link
                href={`/profile/${player.id}`}
                className="flex flex-1 items-center gap-3 min-w-0"
              >
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${player.avatar_color}20` }}
                >
                  <span className="text-foreground font-semibold text-xs">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground text-sm font-medium truncate">{player.full_name}</span>
                    {isPlayerCaptain && (
                      <Crown size={11} className="text-draw shrink-0" fill="currentColor" />
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">{player.position ?? "N/A"}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                  <span title="Goals">
                    <Crosshair size={11} className="inline mr-0.5 text-draw" />
                    {player.goals}
                  </span>
                  <span title="Cards">
                    <ShieldAlert size={11} className="inline mr-0.5 text-warning" />
                    {player.yellow_cards + player.red_cards}
                  </span>
                </div>
              </Link>
              {canRemove && (
                <button
                  onClick={(e) => handleRemoveClick(e, player.id, player.full_name)}
                  className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-loss/10 transition-colors shrink-0"
                  title="Remove from team"
                >
                  <UserMinus size={14} className="text-muted-foreground hover:text-loss" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
    </>
  );
}

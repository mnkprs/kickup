"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { leaveTeamAction } from "@/app/actions/teams";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface LeaveTeamButtonProps {
  teamId: string;
  teamName: string;
  isCaptain: boolean;
}

export function LeaveTeamButton({ teamId, teamName, isCaptain }: LeaveTeamButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await leaveTeamAction(teamId);
    setLoading(false);
  }

  const message = isCaptain
    ? `Leave ${teamName}? If you're the only member, the team will be deleted. Otherwise, another player will become captain.`
    : `Leave ${teamName}? You can request to join again later.`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-loss hover:bg-loss/5 border border-border hover:border-loss/30 transition-colors pressable"
      >
        <LogOut size={16} />
        Leave team
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        title="Leave team"
        message={message}
        buttons={{ confirmLabel: "Leave", variant: "destructive" }}
        loading={loading}
        onConfirm={handleConfirm}
      />
    </>
  );
}

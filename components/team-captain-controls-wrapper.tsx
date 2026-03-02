"use client";

import { useState, useTransition } from "react";
import { TeamCaptainControls } from "./team-captain-controls";
import { approveJoinRequestAction, rejectJoinRequestAction } from "@/app/actions/teams";
import type { TeamMember, Profile } from "@/lib/types";

interface TeamCaptainControlsWrapperProps {
  pendingRequests: (TeamMember & { profile: Profile })[];
  teamId: string;
}

export function TeamCaptainControlsWrapper({
  pendingRequests,
  teamId,
}: TeamCaptainControlsWrapperProps) {
  const [pendingMembers, setPendingMembers] = useState(pendingRequests);
  const [isPending, startTransition] = useTransition();

  const handleApprove = async (playerId: string) => {
    startTransition(async () => {
      const result = await approveJoinRequestAction(teamId, playerId);
      if (result.success) {
        setPendingMembers((prev) => prev.filter((m) => m.player_id !== playerId));
      }
    });
  };

  const handleReject = async (playerId: string) => {
    startTransition(async () => {
      const result = await rejectJoinRequestAction(teamId, playerId);
      if (result.success) {
        setPendingMembers((prev) => prev.filter((m) => m.player_id !== playerId));
      }
    });
  };

  return (
    <TeamCaptainControls
      pendingRequests={pendingMembers}
      onApprove={handleApprove}
      onReject={handleReject}
    />
  );
}

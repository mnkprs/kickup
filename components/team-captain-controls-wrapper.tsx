"use client";

import { useState, useTransition } from "react";
import { TeamCaptainControls } from "./team-captain-controls";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
  removeMemberAction,
} from "@/app/actions/teams";
import type { TeamMember, Profile } from "@/lib/types";

interface TeamCaptainControlsWrapperProps {
  pendingRequests: (TeamMember & { profile: Profile })[];
  activeMembers: (TeamMember & { profile: Profile })[];
  teamId: string;
  myPlayerId: string;
}

export function TeamCaptainControlsWrapper({
  pendingRequests,
  activeMembers,
  teamId,
  myPlayerId,
}: TeamCaptainControlsWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingMembers, setPendingMembers] = useState(pendingRequests);
  const [activeMembersState, setActiveMembersState] = useState(activeMembers);

  const handleApprove = async (playerId: string) => {
    startTransition(async () => {
      const result = await approveJoinRequestAction(teamId, playerId);
      if (result.success) {
        setPendingMembers((prev) => prev.filter((m) => m.player_id !== playerId));
        setActiveMembersState((prev) => prev);
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

  const handleRemove = async (playerId: string) => {
    startTransition(async () => {
      const result = await removeMemberAction(teamId, playerId);
      if (result.success) {
        setActiveMembersState((prev) => prev.filter((m) => m.player_id !== playerId));
      }
    });
  };

  return (
    <TeamCaptainControls
      pendingRequests={pendingMembers}
      activeMembers={activeMembersState}
      teamId={teamId}
      myPlayerId={myPlayerId}
      onApprove={handleApprove}
      onReject={handleReject}
      onRemove={handleRemove}
    />
  );
}

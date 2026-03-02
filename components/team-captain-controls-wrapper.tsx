"use client";

import { useState, useTransition } from "react";
import { TeamCaptainControls } from "./team-captain-controls";
import { SearchingToggle } from "./searching-toggle";
import { LookingForPlayersToggle } from "./looking-for-players-toggle";
import { approveJoinRequestAction, rejectJoinRequestAction } from "@/app/actions/teams";
import type { TeamMember, Profile } from "@/lib/types";

interface TeamCaptainControlsWrapperProps {
  pendingRequests: (TeamMember & { profile: Profile })[];
  teamId: string;
  searchingForOpponent?: boolean;
  searchingForPlayers?: boolean;
}

export function TeamCaptainControlsWrapper({
  pendingRequests,
  teamId,
  searchingForOpponent = false,
  searchingForPlayers = false,
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
    <section className="px-5">
      <h2 className="text-foreground font-semibold text-sm mb-3">Captain</h2>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <SearchingToggle
            teamId={teamId}
            initial={searchingForOpponent}
          />
          <LookingForPlayersToggle
            teamId={teamId}
            initial={searchingForPlayers}
          />
        </div>
        <TeamCaptainControls
          pendingRequests={pendingMembers}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
    </section>
  );
}

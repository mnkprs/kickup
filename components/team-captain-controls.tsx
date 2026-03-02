"use client";

import { X, Check } from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { TeamMember, Profile } from "@/lib/types";

interface TeamCaptainControlsProps {
  pendingRequests: (TeamMember & { profile: Profile })[];
  onApprove: (playerId: string) => void;
  onReject: (playerId: string) => void;
}

export function TeamCaptainControls({
  pendingRequests,
  onApprove,
  onReject,
}: TeamCaptainControlsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-foreground font-semibold text-sm">
          Pending Join Requests ({pendingRequests.length})
        </h3>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card divide-y divide-border">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => {
              const player = request.profile;
              return (
                <div key={request.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar
                    avatar_url={player.avatar_url}
                    avatar_initials={player.avatar_initials}
                    avatar_color={player.avatar_color}
                    full_name={player.full_name}
                    size="sm"
                    colorOpacity="20"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-foreground text-sm font-medium block truncate">
                      {player.full_name}
                    </span>
                    <span className="text-muted-foreground text-xs">{player.position ?? "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onApprove(request.player_id)}
                      className="h-8 w-8 rounded-lg bg-win/10 flex items-center justify-center hover:bg-win/20 transition-colors"
                      title="Approve"
                    >
                      <Check size={14} className="text-win" />
                    </button>
                    <button
                      onClick={() => onReject(request.player_id)}
                      className="h-8 w-8 rounded-lg bg-loss/10 flex items-center justify-center hover:bg-loss/20 transition-colors"
                      title="Reject"
                    >
                      <X size={14} className="text-loss" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-muted-foreground text-sm">No pending requests</p>
              <p className="text-muted-foreground text-xs mt-1">
                When players request to join, they&apos;ll appear here
              </p>
            </div>
          )}
        </div>
    </div>
  );
}

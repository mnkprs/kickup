"use client";

import { X, Check, Trash2, UserMinus, Crown } from "lucide-react";
import type { TeamMember, Profile } from "@/lib/types";

interface TeamCaptainControlsProps {
  pendingRequests: (TeamMember & { profile: Profile })[];
  activeMembers: (TeamMember & { profile: Profile })[];
  teamId: string;
  myPlayerId: string;
  onApprove: (playerId: string) => void;
  onReject: (playerId: string) => void;
  onRemove: (playerId: string) => void;
}

export function TeamCaptainControls({
  pendingRequests,
  activeMembers,
  teamId,
  myPlayerId,
  onApprove,
  onReject,
  onRemove,
}: TeamCaptainControlsProps) {
  return (
    <>
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <section className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-foreground font-semibold text-sm">
              Join Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="rounded-xl bg-card border border-border divide-y divide-border">
            {pendingRequests.map((request) => {
              const player = request.profile;
              const initials = player.avatar_initials || player.full_name.split(" ").map((n) => n[0]).join("");
              return (
                <div key={request.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${player.avatar_color}20` }}
                  >
                    <span className="text-foreground font-semibold text-xs">{initials}</span>
                  </div>
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
            })}
          </div>
        </section>
      )}

      {/* Active Members Management (Captain only) */}
      <section className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-foreground font-semibold text-sm">Manage Members</h2>
        </div>
        <div className="rounded-xl bg-card border border-border divide-y divide-border">
          {activeMembers.map((member) => {
            const player = member.profile;
            const isCaptain = member.role === "captain";
            const isMe = member.player_id === myPlayerId;
            const initials = player.avatar_initials || player.full_name.split(" ").map((n) => n[0]).join("");

            return (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${player.avatar_color}20` }}
                >
                  <span className="text-foreground font-semibold text-xs">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground text-sm font-medium truncate">{player.full_name}</span>
                    {isCaptain && <Crown size={11} className="text-draw shrink-0" fill="currentColor" />}
                  </div>
                  <span className="text-muted-foreground text-xs">{player.position ?? "N/A"}</span>
                </div>
                {!isMe && (
                  <button
                    onClick={() => onRemove(member.player_id)}
                    className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-loss/10 transition-colors"
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

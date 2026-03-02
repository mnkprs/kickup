"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Users } from "lucide-react";
import type { TournamentPendingRegistration } from "@/lib/types";
import {
  approveTournamentRegistrationAction,
  rejectTournamentRegistrationAction,
} from "@/app/actions/tournaments";
import { TeamAvatar } from "@/components/team-avatar";

interface TournamentPendingRegistrationsProps {
  registrations: TournamentPendingRegistration[];
  tournamentId: string;
}

export function TournamentPendingRegistrations({
  registrations,
  tournamentId,
}: TournamentPendingRegistrationsProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const visible = registrations.filter((r) => !removed.has(r.id));
  if (visible.length === 0) return null;

  async function handleApprove(id: string) {
    setLoadingId(id);
    const result = await approveTournamentRegistrationAction(id, tournamentId);
    setLoadingId(null);
    if (result.error) return;
    setRemoved((prev) => new Set(prev).add(id));
    router.refresh();
  }

  async function handleReject(id: string) {
    setLoadingId(id);
    const result = await rejectTournamentRegistrationAction(id, tournamentId);
    setLoadingId(null);
    if (result.error) return;
    setRemoved((prev) => new Set(prev).add(id));
    router.refresh();
  }

  return (
    <section className="px-5">
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-muted-foreground" />
        <h2 className="text-foreground font-semibold text-base">Pending Applications</h2>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-card divide-y divide-border">
        {visible.map((reg) => (
          <div
            key={reg.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <TeamAvatar team={reg.team} size="2xs" />
              <span className="text-foreground text-sm font-medium truncate">
                {reg.team.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleApprove(reg.id)}
                disabled={loadingId !== null}
                className="h-8 w-8 rounded-lg bg-win/15 text-win flex items-center justify-center hover:bg-win/25 disabled:opacity-50 transition-colors pressable"
                aria-label="Approve"
              >
                <Check size={16} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => handleReject(reg.id)}
                disabled={loadingId !== null}
                className="h-8 w-8 rounded-lg bg-loss/15 text-loss flex items-center justify-center hover:bg-loss/25 disabled:opacity-50 transition-colors pressable"
                aria-label="Decline"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

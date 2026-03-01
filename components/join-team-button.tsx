"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Clock, Check } from "lucide-react";
import { joinTeamAction } from "@/app/actions/teams";

interface JoinTeamButtonProps {
  teamId: string;
  hasPendingRequest: boolean;
  isAlreadyMember: boolean;
}

export function JoinTeamButton({ teamId, hasPendingRequest, isAlreadyMember }: JoinTeamButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(hasPendingRequest);
  const [error, setError] = useState("");

  if (isAlreadyMember) return null;

  if (pending) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-draw/10 border border-draw/20 text-draw text-sm font-medium">
        <Clock size={15} />
        Request Pending
      </div>
    );
  }

  async function handleJoin() {
    setLoading(true);
    setError("");
    const result = await joinTeamAction(teamId);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setPending(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleJoin}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
        ) : (
          <>
            <UserPlus size={15} />
            Request to Join
          </>
        )}
      </button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

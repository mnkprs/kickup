"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Clock, CheckCircle2, LogOut } from "lucide-react";
import { registerForTournamentAction, withdrawFromTournamentAction } from "@/app/actions/tournaments";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface RegisterTournamentButtonProps {
  tournamentId: string;
  teamId: string;
  registrationStatus: "none" | "pending" | "approved" | "rejected";
  isFull: boolean;
  /** Only when registration phase can captain withdraw */
  canWithdraw?: boolean;
}

export function RegisterTournamentButton({
  tournamentId,
  teamId,
  registrationStatus,
  isFull,
  canWithdraw = false,
}: RegisterTournamentButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(registrationStatus);
  const [error, setError] = useState("");
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  if (status === "approved") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-win/10 border border-win/20 text-win text-sm font-medium">
          <CheckCircle2 size={15} />
          Registered
        </div>
        {canWithdraw && (
          <>
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-muted/50 hover:text-foreground transition-colors w-full pressable disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
              ) : (
                <>
                  <LogOut size={14} />
                  Withdraw
                </>
              )}
            </button>
            <ConfirmModal
              open={showWithdrawConfirm}
              onClose={() => setShowWithdrawConfirm(false)}
              onConfirm={async () => {
                setLoading(true);
                setError("");
                const result = await withdrawFromTournamentAction(tournamentId, teamId);
                setLoading(false);
                setShowWithdrawConfirm(false);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setStatus("none");
                router.refresh();
              }}
              title="Withdraw from tournament?"
              message="Your team will be removed from this tournament. You can register again before registration closes."
              buttons={{ confirmLabel: "Withdraw", variant: "destructive" }}
            />
            {error && <p className="text-destructive text-xs text-center">{error}</p>}
          </>
        )}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-draw/10 border border-draw/20 text-draw text-sm font-medium">
        <Clock size={15} />
        Registration Pending
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium text-center">
        League Full
      </div>
    );
  }

  async function handleRegister() {
    setLoading(true);
    setError("");
    const result = await registerForTournamentAction(tournamentId, teamId);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setStatus((result.status as "pending" | "approved" | "rejected" | "none") ?? "pending");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleRegister}
        disabled={loading}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity w-full pressable"
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
        ) : (
          <>
            <Trophy size={15} />
            Register Team
          </>
        )}
      </button>
      {error && <p className="text-destructive text-xs text-center">{error}</p>}
    </div>
  );
}

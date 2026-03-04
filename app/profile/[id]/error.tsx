"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function PlayerProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="player-profile-error min-h-dvh bg-background max-w-lg mx-auto flex flex-col items-center justify-center gap-4 px-5">
      <div className="player-profile-error__icon h-14 w-14 rounded-full bg-loss/10 flex items-center justify-center">
        <AlertTriangle size={24} className="text-loss" />
      </div>
      <div className="player-profile-error__content text-center">
        <h2 className="player-profile-error__title text-foreground font-semibold text-lg mb-1">
          Could not load player profile
        </h2>
        <p className="player-profile-error__message text-muted-foreground text-sm">
          {error.message ?? "An unexpected error occurred."}
        </p>
      </div>
      <button
        onClick={reset}
        className="player-profile-error__retry-btn px-6 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity pressable"
      >
        Try again
      </button>
    </div>
  );
}

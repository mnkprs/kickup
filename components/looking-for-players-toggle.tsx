"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { setTeamSearchingForPlayersAction } from "@/app/actions/teams";

interface LookingForPlayersToggleProps {
  teamId: string;
  initial: boolean;
}

export function LookingForPlayersToggle({ teamId, initial }: LookingForPlayersToggleProps) {
  const [searching, setSearching] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const next = !searching;
    const result = await setTeamSearchingForPlayersAction(teamId, next);
    setLoading(false);
    if (!result.error) setSearching(next);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border disabled:opacity-50 ${
        searching
          ? "bg-accent text-accent-foreground border-accent"
          : "bg-card text-muted-foreground border-border hover:text-foreground"
      }`}
    >
      <UserPlus size={15} className={searching ? "text-accent-foreground" : "text-muted-foreground"} />
      {searching ? "Looking for Players" : "Find Players"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import { toggleSearchingForOpponentAction } from "@/app/actions/teams";
import { LiveDot } from "@/components/ui/live-dot";

interface SearchingToggleProps {
  teamId: string;
  initial: boolean;
}

export function SearchingToggle({ teamId, initial }: SearchingToggleProps) {
  const [searching, setSearching] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const next = !searching;
    const result = await toggleSearchingForOpponentAction(teamId, next);
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
      {searching && <LiveDot className="shrink-0" />}
      <Swords size={15} className={searching ? "text-accent-foreground" : "text-muted-foreground"} />
      {searching ? "Looking for Opponent" : "Find an Opponent"}
    </button>
  );
}

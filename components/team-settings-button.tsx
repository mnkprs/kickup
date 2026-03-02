"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Settings } from "lucide-react";
import type { Team } from "@/lib/types";

const TeamSettingsSheet = dynamic(
  () => import("@/components/team-settings-sheet").then((m) => m.TeamSettingsSheet),
  { ssr: false },
);

interface TeamSettingsButtonProps {
  team: Team;
  searchingForOpponent: boolean;
  searchingForPlayers: boolean;
  isCaptain: boolean;
}

export function TeamSettingsButton({
  team,
  searchingForOpponent,
  searchingForPlayers,
  isCaptain,
}: TeamSettingsButtonProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors shrink-0 pressable"
        aria-label="Team settings"
      >
        <Settings size={18} className="text-muted-foreground" />
      </button>
      {sheetOpen && (
        <TeamSettingsSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          team={team}
          searchingForOpponent={searchingForOpponent}
          searchingForPlayers={searchingForPlayers}
          isCaptain={isCaptain}
        />
      )}
    </>
  );
}

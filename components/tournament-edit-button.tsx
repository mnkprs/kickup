"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Tournament } from "@/lib/types";
import type { AreaGroup } from "@/lib/types";
import { EditTournamentSheet } from "@/components/edit-tournament-sheet";

interface TournamentEditButtonProps {
  tournament: Tournament;
  areaGroups: AreaGroup[];
}

export function TournamentEditButton({ tournament, areaGroups }: TournamentEditButtonProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors shrink-0"
        aria-label="Edit tournament"
      >
        <Pencil size={18} className="text-muted-foreground" />
      </button>
      <EditTournamentSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tournament={tournament}
        areaGroups={areaGroups}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import type { Tournament } from "@/lib/types";
import { TournamentHeader } from "@/components/tournament-header";
import { TournamentOverviewStats } from "@/components/tournament-overview-stats";
import { TournamentList } from "@/components/tournament-list";

interface TournamentsPageClientProps {
  tournaments: Tournament[];
  canCreate: boolean;
}

export function TournamentsPageClient({
  tournaments,
  canCreate,
}: TournamentsPageClientProps) {
  const [filter, setFilter] = useState("All");

  return (
    <>
      <TournamentHeader onFilterChange={setFilter} activeFilter={filter} canCreate={canCreate} />

      <main className="flex flex-col gap-6 pb-24 pt-4">
        <TournamentOverviewStats tournaments={tournaments} />
        <TournamentList tournaments={tournaments} filter={filter} />
      </main>
    </>
  );
}

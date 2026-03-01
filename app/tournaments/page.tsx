"use client";

import { useState } from "react";
import { TournamentHeader } from "@/components/tournament-header";
import { TournamentOverviewStats } from "@/components/tournament-overview-stats";
import { TournamentList } from "@/components/tournament-list";
import { TournamentStandings } from "@/components/tournament-standings";
import { TournamentFixtures } from "@/components/tournament-fixtures";
import { TournamentScorers } from "@/components/tournament-scorers";
import { BottomNav } from "@/components/bottom-nav";

export default function TournamentsPage() {
  const [filter, setFilter] = useState("All");

  return (
    <div className="min-h-dvh bg-background max-w-lg mx-auto relative">
      <TournamentHeader onFilterChange={setFilter} activeFilter={filter} />

      <main className="flex flex-col gap-6 pb-24 pt-4">
        <TournamentOverviewStats />
        <TournamentList filter={filter} />
        <TournamentStandings />
        <TournamentFixtures />
        <TournamentScorers />
      </main>

      <BottomNav />
    </div>
  );
}

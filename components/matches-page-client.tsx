"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Match } from "@/lib/types";
import { MatchesHeader, type MatchFilters } from "@/components/matches-header";
import { MatchesUpcoming } from "@/components/matches-upcoming";
import { MatchesResults } from "@/components/matches-results";

interface MatchesPageClientProps {
  upcomingMatches: Match[];
  recentResults: Match[];
  teamId: string | null;
}

export function MatchesPageClient({
  upcomingMatches,
  recentResults,
  teamId,
}: MatchesPageClientProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam === "Results" ? "Results" : "Upcoming");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MatchFilters>({ format: "All" });

  useEffect(() => {
    if (tabParam === "Results") setActiveTab("Results");
  }, [tabParam]);

  const filteredUpcoming = useMemo(() =>
    filters.format === "All"
      ? upcomingMatches
      : upcomingMatches.filter((m) => m.format === filters.format),
    [upcomingMatches, filters.format]
  );

  const filteredResults = useMemo(() =>
    filters.format === "All"
      ? recentResults
      : recentResults.filter((m) => m.format === filters.format),
    [recentResults, filters.format]
  );

  return (
    <>
      <MatchesHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
      />

      <main className="flex flex-col gap-6 pb-24 pt-4">
        {activeTab === "Upcoming" && <MatchesUpcoming matches={filteredUpcoming} />}
        {activeTab === "Results" && <MatchesResults matches={filteredResults} teamId={teamId} />}
      </main>

    </>
  );
}

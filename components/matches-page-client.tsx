"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Match } from "@/lib/types";
import { MatchesHeader, type MatchFilters } from "@/components/matches-header";
import { MatchesUpcoming } from "@/components/matches-upcoming";
import { MatchesResults } from "@/components/matches-results";

interface MatchesPageClientProps {
  upcomingMatches: Match[];
  recentResults: Match[];
  myUpcomingMatches: Match[] | null;
  myRecentResults: Match[] | null;
  teamId: string | null;
}

export function MatchesPageClient({
  upcomingMatches,
  recentResults,
  myUpcomingMatches,
  myRecentResults,
  teamId,
}: MatchesPageClientProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const myTeamParam = searchParams.get("myTeam");
  const [activeTab, setActiveTab] = useState(tabParam === "Results" ? "Results" : "Upcoming");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MatchFilters>({
    format: "All",
    myMatchesOnly: myTeamParam === "1" && !!teamId,
  });

  useEffect(() => {
    if (tabParam === "Results") setActiveTab("Results");
  }, [tabParam]);

  const baseUpcoming = filters.myMatchesOnly && teamId && myUpcomingMatches
    ? myUpcomingMatches
    : upcomingMatches;
  const baseResults = filters.myMatchesOnly && teamId && myRecentResults
    ? myRecentResults
    : recentResults;

  const filteredUpcoming = useMemo(() =>
    filters.format === "All"
      ? baseUpcoming
      : baseUpcoming.filter((m) => m.format === filters.format),
    [baseUpcoming, filters.format]
  );

  const filteredResults = useMemo(() =>
    filters.format === "All"
      ? baseResults
      : baseResults.filter((m) => m.format === filters.format),
    [baseResults, filters.format]
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
        teamId={teamId}
      />

      <main className="flex flex-col gap-6 pb-24 pt-4">
        {activeTab === "Upcoming" && (
          filters.myMatchesOnly && filteredUpcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 px-5 text-center">
              <p className="text-muted-foreground text-sm">No matches for your team yet</p>
              <div className="flex gap-2 items-center">
                <Link
                  href="/matches/challenge"
                  className="text-accent text-xs font-medium hover:underline"
                >
                  Challenge a team
                </Link>
                <span className="text-muted-foreground">·</span>
                <button
                  onClick={() => setFilters((f) => ({ ...f, myMatchesOnly: false }))}
                  className="text-accent text-xs font-medium hover:underline"
                >
                  Browse all matches
                </button>
              </div>
            </div>
          ) : (
            <MatchesUpcoming matches={filteredUpcoming} />
          )
        )}
        {activeTab === "Results" && (
          filters.myMatchesOnly && filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 px-5 text-center">
              <p className="text-muted-foreground text-sm">No results for your team yet</p>
              <button
                onClick={() => setFilters((f) => ({ ...f, myMatchesOnly: false }))}
                className="text-accent text-xs font-medium hover:underline"
              >
                Browse all results
              </button>
            </div>
          ) : (
            <MatchesResults matches={filteredResults} teamId={teamId} />
          )
        )}
      </main>
    </>
  );
}

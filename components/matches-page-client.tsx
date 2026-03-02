"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Match } from "@/lib/types";
import { MatchesHeader, type MatchFilters } from "@/components/matches-header";
import { MatchesUpcoming } from "@/components/matches-upcoming";
import { MatchesResults } from "@/components/matches-results";
import type { AreaGroup } from "@/lib/types";

interface MatchesPageClientProps {
  upcomingMatches: Match[];
  recentResults: Match[];
  myUpcomingMatches: Match[] | null;
  myRecentResults: Match[] | null;
  teamId: string | null;
  areaGroups: AreaGroup[];
}

export function MatchesPageClient({
  upcomingMatches,
  recentResults,
  myUpcomingMatches,
  myRecentResults,
  teamId,
  areaGroups,
}: MatchesPageClientProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const myTeamParam = searchParams.get("myTeam");
  const [activeTab, setActiveTab] = useState(tabParam === "Results" ? "Results" : "Upcoming");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MatchFilters>({
    format: "All",
    myMatchesOnly: myTeamParam === "1" && !!teamId,
    tournamentId: "",
    city: "",
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

  const availableTournaments = useMemo(() => {
    const all = [...baseUpcoming, ...baseResults];
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const m of all) {
      if (m.tournament && !seen.has(m.tournament.id)) {
        seen.add(m.tournament.id);
        list.push(m.tournament);
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [baseUpcoming, baseResults]);

  const cityAreas = useMemo(() => {
    if (!filters.city) return null;
    return areaGroups.find((g) => g.city === filters.city)?.areas ?? null;
  }, [areaGroups, filters.city]);

  const filteredUpcoming = useMemo(() => {
    let list = baseUpcoming;
    if (filters.format !== "All") {
      list = list.filter((m) => m.format === filters.format);
    }
    if (filters.tournamentId) {
      list = list.filter((m) => m.tournament?.id === filters.tournamentId);
    }
    if (cityAreas) {
      list = list.filter(
        (m) =>
          (m.home_team.area && cityAreas.includes(m.home_team.area)) ||
          (m.away_team.area && cityAreas.includes(m.away_team.area))
      );
    }
    return list;
  }, [baseUpcoming, filters.format, filters.tournamentId, cityAreas]);

  const filteredResults = useMemo(() => {
    let list = baseResults;
    if (filters.format !== "All") {
      list = list.filter((m) => m.format === filters.format);
    }
    if (filters.tournamentId) {
      list = list.filter((m) => m.tournament?.id === filters.tournamentId);
    }
    if (cityAreas) {
      list = list.filter(
        (m) =>
          (m.home_team.area && cityAreas.includes(m.home_team.area)) ||
          (m.away_team.area && cityAreas.includes(m.away_team.area))
      );
    }
    return list;
  }, [baseResults, filters.format, filters.tournamentId, cityAreas]);

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
        areaGroups={areaGroups}
        availableTournaments={availableTournaments}
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

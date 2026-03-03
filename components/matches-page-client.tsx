"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

function buildMatchesUrl(params: { tab?: string; myTeam?: boolean }) {
  const search = new URLSearchParams();
  if (params.tab && params.tab !== "Upcoming") search.set("tab", params.tab);
  if (params.myTeam) search.set("myTeam", "1");
  const qs = search.toString();
  return `${window.location.pathname}${qs ? `?${qs}` : ""}`;
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

  const [activeTab, setActiveTabState] = useState(tabParam === "Results" ? "Results" : "Upcoming");
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFiltersState] = useState<MatchFilters>({
    format: "All",
    myMatchesOnly: myTeamParam === "1" && !!teamId,
    tournamentId: "",
    city: "",
  });

  const setActiveTab = useCallback((tab: string) => {
    const t = tab === "Results" ? "Results" : "Upcoming";
    setActiveTabState(t);
    window.history.replaceState(null, "", buildMatchesUrl({ tab: t, myTeam: filters.myMatchesOnly }));
  }, [filters.myMatchesOnly]);

  const setFilters = useCallback((next: MatchFilters | ((prev: MatchFilters) => MatchFilters)) => {
    setFiltersState((prev) => {
      const nextFilters = typeof next === "function" ? next(prev) : next;
      if (nextFilters.myMatchesOnly !== prev.myMatchesOnly) {
        window.history.replaceState(
          null,
          "",
          buildMatchesUrl({ tab: activeTabRef.current, myTeam: nextFilters.myMatchesOnly })
        );
      }
      return nextFilters;
    });
  }, []);

  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const myTeam = params.get("myTeam") === "1" && !!teamId;
      if (tab === "Results") setActiveTabState("Results");
      else setActiveTabState("Upcoming");
      setFiltersState((f) => (f.myMatchesOnly !== myTeam ? { ...f, myMatchesOnly: myTeam } : f));
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [teamId]);

  const baseUpcoming = filters.myMatchesOnly && teamId && myUpcomingMatches
    ? myUpcomingMatches
    : upcomingMatches;
  const baseResults = filters.myMatchesOnly && teamId && myRecentResults
    ? myRecentResults
    : recentResults;

  const availableTournaments = useMemo(() => {
    const allMatches = [
      ...upcomingMatches,
      ...recentResults,
      ...(myUpcomingMatches ?? []),
      ...(myRecentResults ?? []),
    ];
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    for (const m of allMatches) {
      if (m.tournament && !seen.has(m.tournament.id)) {
        seen.add(m.tournament.id);
        list.push(m.tournament);
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [upcomingMatches, recentResults, myUpcomingMatches, myRecentResults]);

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
        filteredCounts={{ upcoming: filteredUpcoming.length, results: filteredResults.length }}
      />

      <main className="matches-page__main flex flex-col gap-6 pb-24 pt-4">
        {activeTab === "Upcoming" && (
          filters.myMatchesOnly && filteredUpcoming.length === 0 ? (
            <div className="matches-page__empty flex flex-col items-center justify-center py-12 gap-3 px-5 text-center">
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
            <div className="matches-page__empty matches-page__empty--results flex flex-col items-center justify-center py-12 gap-3 px-5 text-center">
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

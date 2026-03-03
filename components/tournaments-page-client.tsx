"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Tournament } from "@/lib/types";
import { TournamentHeader } from "@/components/tournament-header";
import { TournamentOverviewStats } from "@/components/tournament-overview-stats";
import { TournamentList } from "@/components/tournament-list";

const VALID_FILTERS = ["All", "Active", "Upcoming", "Completed"] as const;

function parseFilter(param: string | null): string {
  return VALID_FILTERS.includes(param as (typeof VALID_FILTERS)[number]) ? param! : "All";
}

interface TournamentsPageClientProps {
  tournaments: Tournament[];
  canCreate: boolean;
}

export function TournamentsPageClient({
  tournaments,
  canCreate,
}: TournamentsPageClientProps) {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");

  const [filter, setFilterState] = useState(() => parseFilter(filterParam));

  const setFilter = useCallback((next: string) => {
    setFilterState(next);
    const url = `${window.location.pathname}${next !== "All" ? `?filter=${encodeURIComponent(next)}` : ""}`;
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      setFilterState(parseFilter(params.get("filter")));
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return (
    <>
      <TournamentHeader onFilterChange={setFilter} activeFilter={filter} canCreate={canCreate} />

      <main className="tournaments-page__main flex flex-col gap-6 pb-24 pt-4">
        <TournamentOverviewStats tournaments={tournaments} />
        <TournamentList tournaments={tournaments} filter={filter} />
      </main>
    </>
  );
}

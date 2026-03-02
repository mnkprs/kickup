"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { NotificationsButton } from "@/components/notifications-button";
import type { AreaGroup } from "@/lib/types";

const tabs = ["Upcoming", "Results"];
const formatOptions = ["All", "5v5", "7v7", "11v11"];

export interface MatchTournamentFilter {
  id: string;
  name: string;
}

export interface MatchFilters {
  format: string;
  myMatchesOnly: boolean;
  tournamentId: string;
  city: string;
}

interface MatchesHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  filters: MatchFilters;
  onFiltersChange: (f: MatchFilters) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  teamId: string | null;
  areaGroups: AreaGroup[];
  availableTournaments: MatchTournamentFilter[];
}

export function MatchesHeader({
  activeTab,
  onTabChange,
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
  teamId,
  areaGroups,
  availableTournaments,
}: MatchesHeaderProps) {
  const activeFilterCount =
    (filters.format !== "All" ? 1 : 0) +
    (filters.myMatchesOnly ? 1 : 0) +
    (filters.tournamentId ? 1 : 0) +
    (filters.city ? 1 : 0);

  return (
    <>
      <header className="px-5 pt-12 pb-2">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-foreground font-semibold text-base">Matches</h1>
          <div className="flex items-center gap-2">
            <NotificationsButton />
            <button
              onClick={onToggleFilters}
              className="relative h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
            >
              <SlidersHorizontal size={18} className="text-muted-foreground" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-card border border-border shadow-card">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {showFilters && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={onToggleFilters} />
          <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50 bg-card rounded-t-2xl border-t border-border p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-foreground font-semibold text-base">Filters</h2>
              <button
                onClick={onToggleFilters}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {teamId && (
              <div className="mb-5">
                <p className="text-muted-foreground text-xs font-medium mb-2 uppercase tracking-wider">Scope</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onFiltersChange({ ...filters, myMatchesOnly: false })}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !filters.myMatchesOnly
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All matches
                  </button>
                  <button
                    onClick={() => onFiltersChange({ ...filters, myMatchesOnly: true })}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filters.myMatchesOnly
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    My team only
                  </button>
                </div>
              </div>
            )}

            <div className="mb-5">
              <p className="text-muted-foreground text-xs font-medium mb-2 uppercase tracking-wider">Format</p>
              <div className="flex flex-wrap gap-2">
                {formatOptions.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => onFiltersChange({ ...filters, format: fmt })}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filters.format === fmt
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {availableTournaments.length > 0 && (
              <div className="mb-5">
                <p className="text-muted-foreground text-xs font-medium mb-2 uppercase tracking-wider">Tournament</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onFiltersChange({ ...filters, tournamentId: "" })}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !filters.tournamentId
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  {availableTournaments.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onFiltersChange({ ...filters, tournamentId: t.id })}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors truncate max-w-[140px] ${
                        filters.tournamentId === t.id
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {areaGroups.length > 0 && (
              <div className="mb-5">
                <p className="text-muted-foreground text-xs font-medium mb-2 uppercase tracking-wider">City</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onFiltersChange({ ...filters, city: "" })}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !filters.city
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All
                  </button>
                  {areaGroups.map(({ city }) => (
                    <button
                      key={city}
                      onClick={() => onFiltersChange({ ...filters, city })}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.city === city
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                onFiltersChange({
                  format: "All",
                  myMatchesOnly: false,
                  tournamentId: "",
                  city: "",
                });
                onToggleFilters();
              }}
              className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset filters
            </button>
          </div>
        </>
      )}
    </>
  );
}

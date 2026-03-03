"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { NotificationsButton } from "@/components/notifications/notifications-button";

interface TournamentHeaderProps {
  onFilterChange: (filter: string) => void;
  activeFilter: string;
  canCreate?: boolean;
}

const filters = ["All", "Active", "Upcoming", "Completed"];

export function TournamentHeader({
  onFilterChange,
  activeFilter,
  canCreate = false,
}: TournamentHeaderProps) {
  return (
    <header className="tournament-header px-5 pt-12 pb-2">
      <div className="tournament-header__top flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-foreground font-semibold text-lg">Leagues</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsButton />
          {canCreate && (
            <Link
              href="/tournaments/create"
              className="h-10 w-10 rounded-full bg-accent flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Plus size={18} className="text-accent-foreground" />
            </Link>
          )}
        </div>
      </div>

      <div className="tournament-header__filters flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`tournament-header__filter shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${isActive ? "tournament-header__filter--active" : ""} ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </header>
  );
}

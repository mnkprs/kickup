"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { NotificationsButton } from "@/components/notifications-button";

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
    <header className="px-5 pt-12 pb-2">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
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

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
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

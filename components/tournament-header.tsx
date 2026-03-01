"use client";

import { ArrowLeft, Search, Filter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface TournamentHeaderProps {
  onFilterChange: (filter: string) => void;
  activeFilter: string;
}

const filters = ["All", "Active", "Upcoming", "Completed"];

export function TournamentHeader({
  onFilterChange,
  activeFilter,
}: TournamentHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="px-5 pt-12 pb-2">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
          <h1 className="text-foreground font-semibold text-lg">Tournaments</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
          >
            <Search size={18} className="text-muted-foreground" />
          </button>
          <button className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors">
            <Filter size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search tournaments..."
            autoFocus
            className="w-full rounded-xl bg-card border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>
      )}

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

"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const tabs = ["Upcoming", "Results"];

export function MatchesHeader({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <header className="px-5 pt-12 pb-2">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-foreground font-semibold text-base">Matches</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors">
            <Search size={18} className="text-muted-foreground" />
          </button>
          <button className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors">
            <SlidersHorizontal
              size={18}
              className="text-muted-foreground"
            />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-card border border-border">
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
  );
}

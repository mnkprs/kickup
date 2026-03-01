"use client";

import { Plus } from "lucide-react";

export function CreateMatchFab() {
  return (
    <button
      aria-label="Create new match"
      className="fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/25 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}

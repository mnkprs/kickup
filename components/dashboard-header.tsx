"use client";

import { useState } from "react";
import { currentUser } from "@/lib/mock-data";
import { Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsSheet } from "@/components/notifications-sheet";

export function DashboardHeader() {
  const [notifOpen, setNotifOpen] = useState(false);
  const firstName = currentUser.full_name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 rounded-full bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-semibold text-sm">
              {currentUser.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-win border-2 border-background" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{greeting}</p>
            <h1 className="text-foreground font-semibold text-base leading-tight">
              {firstName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setNotifOpen(true)}
            className="relative h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
          >
            <Bell size={18} className="text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          </button>
        </div>
      </header>

      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}

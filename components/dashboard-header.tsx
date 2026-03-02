"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Profile, Match, Notification } from "@/lib/types";
import { Bell } from "lucide-react";
import { NotificationsSheet } from "@/components/notifications-sheet";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardHeaderProps {
  profile: Profile | null;
  upcomingMatches: Match[];
  recentResults: Match[];
  notifications: Notification[];
}

export function DashboardHeader({ profile, notifications }: DashboardHeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [markedRead, setMarkedRead] = useState(false);
  const firstName = profile ? profile.full_name.split(" ")[0] : "Player";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const initials = profile?.avatar_initials ?? (profile?.full_name.split(" ").map((n) => n[0]).join("") ?? "?");
  const unreadFromProps = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const unreadCount = markedRead ? 0 : unreadFromProps;

  useEffect(() => {
    if (unreadFromProps > 0) setMarkedRead(false);
  }, [unreadFromProps]);

  const handleMarkedRead = useCallback(() => setMarkedRead(true), []);

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="relative h-11 w-11 shrink-0 rounded-full flex items-center justify-center"
            style={{ backgroundColor: profile?.avatar_color ?? "var(--color-accent)" }}
          >
            <span className="text-accent-foreground font-semibold text-sm">
              {initials}
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
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </button>
        </div>
      </header>

      <NotificationsSheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkedRead={handleMarkedRead}
      />
    </>
  );
}

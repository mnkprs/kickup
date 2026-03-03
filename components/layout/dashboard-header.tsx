"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Match, Notification } from "@/lib/types";
import { Bell } from "lucide-react";
import { NotificationsSheet } from "@/components/notifications/notifications-sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { updateFreelancerAction } from "@/app/actions/profile";

function isLookingForTeam(p: Profile): boolean {
  if (!p.is_freelancer) return false;
  const until = p.freelancer_until;
  if (!until) return true;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const pastNoon = now.getHours() >= 12;
  if (until > today) return true;
  if (until === today && !pastNoon) return true;
  return false;
}

interface DashboardHeaderProps {
  profile: Profile | null;
  upcomingMatches: Match[];
  recentResults: Match[];
  notifications: Notification[];
}

export function DashboardHeader({ profile, notifications }: DashboardHeaderProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [markedRead, setMarkedRead] = useState(false);
  const [toggleSaving, setToggleSaving] = useState(false);
  const [optimisticLooking, setOptimisticLooking] = useState<boolean | null>(null);

  const isLooking = optimisticLooking ?? (profile ? isLookingForTeam(profile) : false);

  async function handleToggleLookingForTeam() {
    if (!profile || toggleSaving) return;
    const next = !isLooking;
    setOptimisticLooking(next);
    setToggleSaving(true);
    let until: string | null = null;
    if (next) {
      const now = new Date();
      if (now.getHours() >= 12) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        until = tomorrow.toISOString().split("T")[0];
      } else {
        until = now.toISOString().split("T")[0];
      }
    }
    const result = await updateFreelancerAction({
      is_freelancer: next,
      freelancer_until: until,
    });
    setToggleSaving(false);
    if (result.error) {
      setOptimisticLooking(null);
      return;
    }
    router.refresh();
  }
  const firstName = profile ? profile.full_name.split(" ")[0] : "Player";
  const initials = profile?.avatar_initials ?? (profile?.full_name.split(" ").map((n) => n[0]).join("") ?? "?");
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const unreadFromProps = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const unreadCount = markedRead ? 0 : unreadFromProps;

  useEffect(() => {
    if (unreadFromProps > 0) setMarkedRead(false);
  }, [unreadFromProps]);

  useEffect(() => {
    if (optimisticLooking !== null && profile && isLookingForTeam(profile) === optimisticLooking) {
      setOptimisticLooking(null);
    }
  }, [profile, optimisticLooking]);

  const handleMarkedRead = useCallback(() => setMarkedRead(true), []);

  return (
    <>
      <header className="dashboard-header flex items-center justify-between px-5 pt-12 pb-4">
        <div className="dashboard-header__user flex items-center gap-3">
          {profile ? (
            <div className="dashboard-header__avatar-wrapper relative shrink-0">
              <AvatarUpload profile={profile} size="sm" editable>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-win border-2 border-background" />
              </AvatarUpload>
            </div>
          ) : (
            <div
              className="dashboard-header__avatar-placeholder relative h-11 w-11 shrink-0 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              <span className="text-accent-foreground font-semibold text-sm">
                {initials}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-win border-2 border-background" />
            </div>
          )}
          <div className="dashboard-header__greeting flex flex-col gap-1">
            <p className="dashboard-header__greeting-text text-muted-foreground text-xs">{greeting}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="dashboard-header__greeting-name text-foreground font-semibold text-base leading-tight">
                {firstName}
              </h1>
              {profile && (
                <button
                  onClick={handleToggleLookingForTeam}
                  disabled={toggleSaving}
                  aria-pressed={isLooking}
                  aria-label={isLooking ? "Looking for team (tap to turn off)" : "Not looking for team (tap to turn on)"}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-colors shrink-0 pressable disabled:opacity-50 ${
                    isLooking
                      ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
                      : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span
                    className={`relative flex h-2 w-2 shrink-0 ${
                      isLooking ? "" : "opacity-50"
                    }`}
                  >
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isLooking ? "bg-destructive animate-ping" : "bg-muted-foreground"
                      }`}
                    />
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${
                        isLooking ? "bg-destructive" : "bg-muted-foreground"
                      }`}
                    />
                  </span>
                  Looking for a team
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="dashboard-header__actions flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setNotifOpen(true)}
            className="dashboard-header__notifications-btn relative h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
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

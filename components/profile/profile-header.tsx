"use client";

import type { Profile, Team } from "@/lib/types";
import { Settings, Share2, Crown } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { NotificationsButton } from "@/components/notifications/notifications-button";

interface ProfileHeaderProps {
  profile: Profile;
  team: Team | null;
  showSettings?: boolean;
}

export function ProfileHeader({ profile, team, showSettings = true }: ProfileHeaderProps) {
  const winRate =
    profile.matches_played > 0
      ? Math.round((profile.wins / profile.matches_played) * 100)
      : 0;
  const isCaptain = team?.captain_id === profile.id;

  return (
    <header className="profile-header px-5 pt-12 pb-2">
      <div className="profile-header__top flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {!showSettings && (
            <BackButton />
          )}
          <h1 className="text-foreground font-semibold text-base">Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsButton />
          <button
            aria-label="Share profile"
            onClick={async () => {
              if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share({
                    title: `${profile.full_name} - Kickup Profile`,
                    text: `Check out ${profile.full_name}'s football stats on Kickup`,
                    url: window.location.href,
                  });
                } catch {
                  await navigator.clipboard?.writeText(window.location.href);
                }
              } else {
                await navigator.clipboard?.writeText(window.location.href);
              }
            }}
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
          >
            <Share2 size={18} className="text-muted-foreground" />
          </button>
          {showSettings && (
            <Link
              href="/profile/settings"
              aria-label="Settings"
              className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors pressable"
            >
              <Settings size={18} className="text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>

      <div className="profile-header__card profile-header__card--hero rounded-xl bg-card border border-border shadow-card p-6 mb-2">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {showSettings ? (
              <AvatarUpload profile={profile} size="lg" editable className="ring-4 ring-accent/20">
                <span className="absolute -top-1 -right-2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {winRate}%
                </span>
              </AvatarUpload>
            ) : (
              <AvatarUpload profile={profile} size="lg" editable={false} className="ring-4 ring-accent/20">
                <span className="absolute -top-1 -right-2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {winRate}%
                </span>
              </AvatarUpload>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-foreground font-bold text-xl leading-tight">{profile.full_name}</h2>
            <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
              {profile.position && (
                <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                  {profile.position}
                </span>
              )}
              {profile.is_freelancer && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  Looking for team
                </span>
              )}
              {isCaptain && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-draw">
                  <Crown size={10} fill="currentColor" />
                  Captain
                </span>
              )}
              {team && (
                <span className="text-xs text-muted-foreground">{team.name}</span>
              )}
            </div>
            {profile.bio && (
              <p className="text-muted-foreground text-xs mt-2 max-w-[240px] mx-auto leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="profile-header__card profile-header__card--stats rounded-xl bg-card border border-border shadow-card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-muted-foreground text-xs font-medium">Win Rate</span>
          <span className="text-foreground font-bold text-sm">{winRate}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-2.5">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${winRate}%` }}
          />
        </div>
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-win font-bold text-base leading-none">{profile.wins}</span>
            <span className="text-muted-foreground text-[10px]">Won</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-draw font-bold text-base leading-none">{profile.draws}</span>
            <span className="text-muted-foreground text-[10px]">Drawn</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-loss font-bold text-base leading-none">{profile.losses}</span>
            <span className="text-muted-foreground text-[10px]">Lost</span>
          </div>
        </div>
      </div>
    </header>
  );
}

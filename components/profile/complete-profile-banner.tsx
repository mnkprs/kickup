"use client";

import Link from "next/link";
import { Settings, ChevronRight } from "lucide-react";

interface CompleteProfileBannerProps {
  /** When true, show the banner prompting user to complete profile */
  show: boolean;
}

export function CompleteProfileBanner({ show }: CompleteProfileBannerProps) {
  if (!show) return null;

  return (
    <Link
      href="/profile/settings"
      className="complete-profile-banner flex items-center gap-3 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 mb-5 mx-5 hover:bg-accent/15 transition-colors pressable"
    >
      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
        <Settings size={18} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-semibold text-sm">Complete your profile</p>
        <p className="text-muted-foreground text-xs mt-0.5">
          Add your position and area so others can find you
        </p>
      </div>
      <ChevronRight size={18} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

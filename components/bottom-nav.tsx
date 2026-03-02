"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Swords, Trophy, Users, User, UserSearch } from "lucide-react";

const tabs = [
  { label: "Home", icon: Home, href: "/", match: "/" },
  { label: "Matches", icon: Swords, href: "/matches", match: "/matches" },
  { label: "Teams", icon: Users, href: "/teams", match: "/teams" },
  { label: "Players", icon: UserSearch, href: "/find-players", match: "/find-players" },
  { label: "Leagues", icon: Trophy, href: "/tournaments", match: "/tournaments" },
  { label: "Profile", icon: User, href: "/profile", match: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive =
            tab.match === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.match);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 py-2 px-3 transition-colors pressable"
            >
              <tab.icon
                size={20}
                className={
                  isActive ? "text-accent" : "text-muted-foreground"
                }
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="h-0.5 w-4 rounded-full bg-accent mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

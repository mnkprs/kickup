import { UserSearch, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FindPlayersBannerProps {
  lookingForTeamCount: number;
}

export function FindPlayersBanner({ lookingForTeamCount }: FindPlayersBannerProps) {
  return (
    <section className="find-players-banner px-5">
      <Link
        href="/find-players"
        className="find-players-banner__link rounded-xl p-4 group transition-all shadow-card block bg-card border border-border hover:border-accent/40 pressable"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <UserSearch size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-foreground font-semibold text-sm">Find Players</h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                {lookingForTeamCount === 0
                  ? "Browse all players"
                  : `${lookingForTeamCount} player${lookingForTeamCount === 1 ? "" : "s"} looking for a team`}
              </p>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="text-muted-foreground group-hover:text-accent transition-colors shrink-0"
          />
        </div>
      </Link>
    </section>
  );
}

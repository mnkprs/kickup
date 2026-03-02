import { UserSearch, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FindPlayersBannerProps {
  freelancerCount: number;
}

export function FindPlayersBanner({ freelancerCount }: FindPlayersBannerProps) {
  return (
    <section className="px-5">
      <Link
        href="/find-players"
        className="rounded-xl p-4 group transition-all shadow-card block bg-card border border-border hover:border-accent/40"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <UserSearch size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-foreground font-semibold text-sm">Find Players</h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                {freelancerCount === 0
                  ? "Players looking for a team"
                  : `${freelancerCount} player${freelancerCount === 1 ? "" : "s"} looking for a team`}
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

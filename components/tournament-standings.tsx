import type { TournamentStanding } from "@/lib/types";

interface TournamentStandingsProps {
  standings: TournamentStanding[];
  title?: string;
}

export function TournamentStandings({ standings, title = "Standings" }: TournamentStandingsProps) {
  const sorted = [...standings].sort((a, b) => b.points - a.points);

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-foreground font-semibold text-base">{title}</h2>
      </div>
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem_2.5rem] gap-1 px-4 py-2.5 border-b border-border">
          <span className="text-muted-foreground text-[10px] font-medium">#</span>
          <span className="text-muted-foreground text-[10px] font-medium">Team</span>
          <span className="text-muted-foreground text-[10px] font-medium text-center">P</span>
          <span className="text-muted-foreground text-[10px] font-medium text-center">W</span>
          <span className="text-muted-foreground text-[10px] font-medium text-center">D</span>
          <span className="text-muted-foreground text-[10px] font-medium text-center">L</span>
          <span className="text-muted-foreground text-[10px] font-medium text-center">GD</span>
          <span className="text-muted-foreground text-[10px] font-medium text-right">PTS</span>
        </div>

        {sorted.map((row, i) => {
          const gd = row.goals_for - row.goals_against;
          return (
            <div
              key={row.team_id}
              className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2rem_2.5rem_2.5rem] gap-1 px-4 py-2.5 items-center border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <span className={`text-xs font-medium ${i < 2 ? "text-accent" : "text-muted-foreground"}`}>
                {i + 1}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                  <span className="text-foreground text-[8px] font-bold">{row.team.short_name}</span>
                </div>
                <span className="text-sm truncate text-foreground font-medium">{row.team.name}</span>
              </div>
              <span className="text-foreground text-xs text-center">{row.played}</span>
              <span className="text-foreground text-xs text-center">{row.won}</span>
              <span className="text-foreground text-xs text-center">{row.drawn}</span>
              <span className="text-foreground text-xs text-center">{row.lost}</span>
              <span className={`text-xs text-center font-medium ${gd > 0 ? "text-win" : gd < 0 ? "text-loss" : "text-muted-foreground"}`}>
                {gd > 0 ? `+${gd}` : gd}
              </span>
              <span className="text-foreground text-xs font-bold text-right">{row.points}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

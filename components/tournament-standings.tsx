import type { TournamentStandingsGroup } from "@/lib/types";
import { TeamAvatar } from "@/components/team-avatar";

interface TournamentStandingsProps {
  standingsGroups: TournamentStandingsGroup[];
  title?: string;
}

function StandingsTable({
  rows,
}: {
  rows: {
    rank: number;
    team_id: string;
    team: { short_name: string; name: string; avatar_url?: string | null; emoji?: string; color?: string };
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goals_for: number;
    goals_against: number;
    points: number;
  }[];
}) {
  return (
    <>
      <div className="tournament-standings__header-row grid grid-cols-[1.5rem_minmax(0,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_1.75rem_1.75rem] gap-0.5 px-2 py-1.5 border-b border-border">
        <span className="text-muted-foreground text-[10px] font-medium">#</span>
        <span className="text-muted-foreground text-[10px] font-medium">Team</span>
        <span className="text-muted-foreground text-[10px] font-medium text-center">P</span>
        <span className="text-muted-foreground text-[10px] font-medium text-center">W</span>
        <span className="text-muted-foreground text-[10px] font-medium text-center">D</span>
        <span className="text-muted-foreground text-[10px] font-medium text-center">L</span>
        <span className="text-muted-foreground text-[10px] font-medium text-center">GD</span>
        <span className="text-muted-foreground text-[10px] font-medium text-right">PTS</span>
      </div>
      {rows.map((row, i) => {
        const gd = row.goals_for - row.goals_against;
        return (
          <div
            key={row.team_id}
            className="tournament-standings__row grid grid-cols-[1.5rem_minmax(0,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_1.75rem_1.75rem] gap-0.5 px-2 py-1.5 items-center border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
          >
            <span className={`text-xs font-medium ${i < 2 ? "text-accent" : "text-muted-foreground"}`}>
              {row.rank}
            </span>
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              <TeamAvatar
                avatar_url={row.team.avatar_url}
                emoji={row.team.emoji ?? "⚽"}
                short_name={row.team.short_name}
                name={row.team.name}
                color={row.team.color ?? "#2E7D32"}
                size="2xs"
              />
              <span className="text-xs truncate text-foreground font-medium">{row.team.name}</span>
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
    </>
  );
}

export function TournamentStandings({ standingsGroups, title = "Standings" }: TournamentStandingsProps) {
  const hasAny = standingsGroups.some((g) => g.standings.length > 0);

  return (
    <section className="tournament-standings px-5">
      <div className="tournament-standings__header flex items-center justify-between mb-3">
        <h2 className="tournament-standings__title text-foreground font-semibold text-base">{title}</h2>
      </div>
      <div className="rounded-lg bg-card border border-border shadow-card overflow-hidden">
        {!hasAny ? (
          <div className="px-3 py-6 text-center">
            <p className="text-muted-foreground text-sm">No teams enrolled yet</p>
          </div>
        ) : (
          standingsGroups.map((group) => (
            <div key={group.groupLabel || "all"}>
              {group.groupLabel && (
                <div className="px-3 py-2 bg-muted/30 border-b border-border">
                  <span className="text-xs font-semibold text-foreground">{group.groupLabel}</span>
                </div>
              )}
              <StandingsTable rows={group.standings} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}

import type { Match, Team } from "@/lib/types";
import Link from "next/link";

function getResult(
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
  myTeamId: string
): { label: "W" | "D" | "L"; score: string } {
  const isHome = homeTeamId === myTeamId;
  const myScore = isHome ? homeScore : awayScore;
  const theirScore = isHome ? awayScore : homeScore;
  if (myScore > theirScore) return { label: "W", score: `${myScore}-${theirScore}` };
  if (myScore < theirScore) return { label: "L", score: `${myScore}-${theirScore}` };
  return { label: "D", score: `${myScore}-${theirScore}` };
}

const colorMap = {
  W: "bg-win/15 text-win border-win/30",
  D: "bg-draw/15 text-draw border-draw/30",
  L: "bg-loss/15 text-loss border-loss/30",
} as const;

interface MyFormProps {
  matches: Match[];
  team: Team;
}

export function MyForm({ matches, team }: MyFormProps) {
  const myCompleted = matches
    .filter(
      (m) =>
        m.status === "completed" &&
        (m.home_team_id === team.id || m.away_team_id === team.id)
    )
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .slice(0, 5);

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Recent Form</h2>
        <Link href="/matches?tab=Results" className="text-xs text-accent font-medium">
          All results
        </Link>
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        {myCompleted.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-2">No recent matches</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              {myCompleted.map((match) => {
                const r = getResult(
                  match.home_team_id,
                  match.away_team_id,
                  match.home_score!,
                  match.away_score!,
                  team.id
                );
                return (
                  <Link key={match.id} href={`/matches/${match.id}`} className="flex-1 flex flex-col items-center gap-1 rounded-lg border py-2.5 hover:bg-muted/50 transition-colors block">
                    <span className="text-xs font-bold">{r.label}</span>
                    <span className="text-[10px] font-medium opacity-80">{r.score}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{team.short_name} last {myCompleted.length} matches</span>
              <span className="font-medium text-foreground">
                {myCompleted.filter((m) => getResult(m.home_team_id, m.away_team_id, m.home_score!, m.away_score!, team.id).label === "W").length}W{" "}
                {myCompleted.filter((m) => getResult(m.home_team_id, m.away_team_id, m.home_score!, m.away_score!, team.id).label === "D").length}D{" "}
                {myCompleted.filter((m) => getResult(m.home_team_id, m.away_team_id, m.home_score!, m.away_score!, team.id).label === "L").length}L
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

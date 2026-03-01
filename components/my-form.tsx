import { matches, teams } from "@/lib/mock-data";
import Link from "next/link";

const MY_TEAM_ID = "team_001";

function getResult(
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number
): { label: "W" | "D" | "L"; score: string } {
  const isHome = homeTeamId === MY_TEAM_ID;
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

export function MyForm() {
  const myCompleted = matches
    .filter(
      (m) =>
        m.status === "completed" &&
        (m.home_team.id === MY_TEAM_ID || m.away_team.id === MY_TEAM_ID)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const myTeam = teams.find((t) => t.id === MY_TEAM_ID)!;

  return (
    <section className="px-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Recent Form</h2>
        <Link
          href="/matches?tab=Results"
          className="text-xs text-accent font-medium"
        >
          All results
        </Link>
      </div>

      <div className="rounded-xl bg-card border border-border p-4">
        {/* form pills */}
        <div className="flex items-center gap-2 mb-4">
          {myCompleted.map((match) => {
            const r = getResult(
              match.home_team.id,
              match.away_team.id,
              match.home_score!,
              match.away_score!
            );
            return (
              <div
                key={match.id}
                className={`flex-1 flex flex-col items-center gap-1 rounded-lg border py-2.5 ${colorMap[r.label]}`}
              >
                <span className="text-xs font-bold">{r.label}</span>
                <span className="text-[10px] font-medium opacity-80">
                  {r.score}
                </span>
              </div>
            );
          })}
        </div>

        {/* summary line */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{myTeam.short_name} last {myCompleted.length} matches</span>
          <span className="font-medium text-foreground">
            {myCompleted.filter((m) => {
              const r = getResult(m.home_team.id, m.away_team.id, m.home_score!, m.away_score!);
              return r.label === "W";
            }).length}W{" "}
            {myCompleted.filter((m) => {
              const r = getResult(m.home_team.id, m.away_team.id, m.home_score!, m.away_score!);
              return r.label === "D";
            }).length}D{" "}
            {myCompleted.filter((m) => {
              const r = getResult(m.home_team.id, m.away_team.id, m.home_score!, m.away_score!);
              return r.label === "L";
            }).length}L
          </span>
        </div>
      </div>
    </section>
  );
}

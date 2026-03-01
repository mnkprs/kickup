import { getMatch } from "@/lib/db/matches";
import { ArrowLeft, MapPin, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";

function TeamBlock({
  shortName,
  name,
  score,
  isWinner,
}: {
  shortName: string;
  name: string;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border border-border">
        <span className="text-foreground font-bold text-sm">{shortName}</span>
      </div>
      <span className={`text-sm font-medium text-center leading-tight ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
        {name}
      </span>
      {score !== null && (
        <span className={`text-4xl font-bold ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
          {score}
        </span>
      )}
    </div>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Match not found</p>
      </div>
    );
  }

  const isCompleted = match.status === "completed";
  const homeWin = isCompleted && match.home_score! > match.away_score!;
  const awayWin = isCompleted && match.away_score! > match.home_score!;

  return (
    <>
      {/* Header */}
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/matches"
            className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
          <h1 className="text-foreground font-semibold text-lg">Match</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-col gap-6 pb-24 pt-2">
        {/* Status badge */}
        <div className="flex justify-center">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
            isCompleted
              ? "bg-muted text-muted-foreground"
              : "bg-accent/15 text-accent"
          }`}>
            {isCompleted ? "Full Time" : "Upcoming"}
          </span>
        </div>

        {/* Scoreline */}
        <div className="px-5">
          <div className="rounded-xl bg-card border border-border p-6">
            <div className="flex items-center gap-4">
              <TeamBlock
                shortName={match.home_team.short_name}
                name={match.home_team.name}
                score={match.home_score}
                isWinner={homeWin}
              />

              <div className="flex flex-col items-center gap-1 shrink-0">
                {!isCompleted && (
                  <span className="text-muted-foreground text-xs font-bold">VS</span>
                )}
                {isCompleted && match.home_score === match.away_score && (
                  <span className="text-draw text-xs font-bold px-2 py-0.5 bg-draw/10 rounded-full">
                    Draw
                  </span>
                )}
              </div>

              <TeamBlock
                shortName={match.away_team.short_name}
                name={match.away_team.name}
                score={match.away_score}
                isWinner={awayWin}
              />
            </div>
          </div>
        </div>

        {/* Match info */}
        <div className="px-5">
          <div className="rounded-xl bg-card border border-border divide-y divide-border">
            {match.date && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Calendar size={15} className="text-muted-foreground shrink-0" />
                <span className="text-foreground text-sm">
                  {format(parseISO(match.date), "EEEE, d MMMM yyyy")}
                </span>
              </div>
            )}
            {match.time && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Clock size={15} className="text-muted-foreground shrink-0" />
                <span className="text-foreground text-sm">{match.time.slice(0, 5)}</span>
              </div>
            )}
            {match.location && (
              <div className="flex items-center gap-3 px-4 py-3">
                <MapPin size={15} className="text-muted-foreground shrink-0" />
                <span className="text-foreground text-sm">{match.location}</span>
              </div>
            )}
            {match.format && (
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-muted-foreground text-xs font-medium w-[15px] text-center shrink-0">
                  ⚽
                </span>
                <span className="text-foreground text-sm">{match.format}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

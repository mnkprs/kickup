"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Trophy, Swords, GitBranch } from "lucide-react";
import type { TournamentStandingsGroup } from "@/lib/types";
import type { TournamentMatchWithStage } from "@/lib/db/tournaments";
import type { TopScorer } from "@/lib/types";
import type { Tournament } from "@/lib/types";
import { TournamentStandings } from "@/components/tournaments/tournament-standings";
import { TournamentFixtures } from "@/components/tournaments/tournament-fixtures";
import { TournamentBracket } from "@/components/tournaments/tournament-bracket";
import { TournamentScorers } from "@/components/tournaments/tournament-scorers";
import { TournamentPendingRegistrations } from "@/components/tournaments/tournament-pending-registrations";
import { TournamentOrganizerControls } from "@/components/tournaments/tournament-organizer-controls";
import { TournamentDetailsAccordion } from "@/components/tournaments/tournament-details-accordion";
import { Trophy as TrophyIcon } from "lucide-react";

const TAB_OVERVIEW = "overview";
const TAB_STANDINGS = "standings";
const TAB_FIXTURES = "fixtures";
const TAB_BRACKET = "bracket";

const VALID_TABS = [TAB_OVERVIEW, TAB_STANDINGS, TAB_FIXTURES, TAB_BRACKET] as const;

type TabId = (typeof VALID_TABS)[number];

type ScrollToSection = "standings" | "scorers" | null;

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

interface TournamentDetailClientProps {
  tournamentId: string;
  tournament: Tournament;
  standings: TournamentStandingsGroup[];
  matches: TournamentMatchWithStage[];
  scorers: TopScorer[];
  canManageRegistrations: boolean;
  userTeamId?: string | null;
}

function parseTabFromParam(param: string | null, showBracketTab: boolean): TabId {
  if (param === "scorers") return TAB_STANDINGS;
  if (VALID_TABS.includes(param as TabId)) {
    const t = param as TabId;
    if (t === TAB_BRACKET && !showBracketTab) return TAB_OVERVIEW;
    return t;
  }
  return TAB_OVERVIEW;
}

export function TournamentDetailClient({
  tournamentId,
  tournament,
  standings,
  matches,
  scorers,
  canManageRegistrations,
  userTeamId,
}: TournamentDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showBracketTab = tournament.raw_status === "knockout_stage";
  const scorersRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTabState] = useState<TabId>(() =>
    parseTabFromParam(searchParams.get("tab"), showBracketTab)
  );
  const [scrollToSection, setScrollToSection] = useState<ScrollToSection>(() => {
    const tab = searchParams.get("tab");
    const scroll = searchParams.get("scroll");
    return tab === "scorers" || (tab === "standings" && scroll === "scorers") ? "scorers" : null;
  });

  const tabs: TabConfig[] = useMemo(() => {
    const bracketTab: TabConfig = { id: TAB_BRACKET, label: "Bracket", icon: GitBranch };
    const list: TabConfig[] = [
      { id: TAB_OVERVIEW, label: "Overview", icon: LayoutGrid },
      { id: TAB_STANDINGS, label: "Standings", icon: Trophy },
      { id: TAB_FIXTURES, label: "Fixtures", icon: Swords },
      ...(showBracketTab ? [bracketTab] : []),
    ];
    return list;
  }, [showBracketTab]);

  const setTab = useCallback((tab: TabId, scrollTo?: ScrollToSection) => {
    setActiveTabState(tab);
    setScrollToSection(scrollTo ?? null);
    const url = `${window.location.pathname}?tab=${tab}${scrollTo === "scorers" ? "&scroll=scorers" : ""}`;
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = parseTabFromParam(params.get("tab"), showBracketTab);
      setActiveTabState(tab);
      setScrollToSection(params.get("scroll") === "scorers" ? "scorers" : null);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [showBracketTab]);

  useEffect(() => {
    if (activeTab === TAB_STANDINGS && scrollToSection === "scorers" && scorersRef.current) {
      scorersRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setScrollToSection(null);
    }
  }, [activeTab, scrollToSection]);

  const knockoutMatches = matches.filter(
    (m) =>
      m.stage === "round_of_16" ||
      m.stage === "quarter_final" ||
      m.stage === "semi_final" ||
      m.stage === "final"
  );

  const nextFixture = matches.find((m) => m.status === "upcoming" || m.status === "live");
  const topScorersPreview = scorers.slice(0, 3);
  const hasStandings = standings.some((g) => g.standings.length > 0);

  const isEmpty =
    standings.every((g) => g.standings.length === 0) &&
    matches.length === 0 &&
    scorers.length === 0;

  return (
    <div className="tournament-detail-client px-5">
      <div className="tournament-detail__tabs sticky top-0 z-30 bg-background py-3 -mx-5">
        <div
          className="flex flex-nowrap gap-1 p-1 rounded-xl bg-card border border-border shadow-card overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`tournament-detail__tab flex-1 min-w-0 snap-start flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[2.75rem] ${
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-selected={activeTab === tab.id}
              aria-controls={`tournament-tabpanel-${tab.id}`}
              id={`tournament-tab-${tab.id}`}
              role="tab"
            >
              <tab.icon size={14} className="shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="tournament-detail__main flex flex-col gap-6 pb-24 pt-4">
        {activeTab === TAB_OVERVIEW && (
          <div
            id="tournament-tabpanel-overview"
            role="tabpanel"
            aria-labelledby="tournament-tab-overview"
            className="flex flex-col gap-6"
          >
            <TournamentDetailsAccordion
              details={{
                organizerId: tournament.organizer_id,
                organizer: tournament.organizer,
                bracketFormat: tournament.format,
                matchFormat: tournament.match_format,
                startDate: tournament.start_date,
                endDate: tournament.end_date,
                area: tournament.area,
                venue: tournament.venue,
                teamsCount: tournament.teams_count,
                maxTeams: tournament.max_teams,
                prize: tournament.prize,
                description: tournament.description,
              }}
            />

            {canManageRegistrations && tournament.pending_registrations.length > 0 && (
              <TournamentPendingRegistrations
                registrations={tournament.pending_registrations}
                tournamentId={tournamentId}
              />
            )}

            {canManageRegistrations &&
              tournament.raw_status &&
              tournament.raw_status !== "completed" && (
                <TournamentOrganizerControls
                  tournamentId={tournamentId}
                  rawStatus={tournament.raw_status}
                  teamsCount={tournament.teams_count}
                  knockoutMode={tournament.knockout_mode}
                  knockoutMatches={knockoutMatches}
                  advancingTeams={standings.flatMap((g) =>
                    g.standings.slice(0, 2).map((s) => ({
                      id: s.team_id,
                      name: s.team.name,
                      short_name: s.team.short_name,
                    }))
                  )}
                />
              )}

            {(nextFixture || topScorersPreview.length > 0 || hasStandings) && (
              <div className="tournament-overview__preview flex flex-col gap-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick links
                </h3>
                <div className="flex flex-col gap-2">
                  {nextFixture && (
                    <button
                      type="button"
                      onClick={() => setTab(TAB_FIXTURES)}
                      className="w-full text-left rounded-xl bg-card border border-border shadow-card p-4 hover:border-accent/40 transition-colors pressable"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Next fixture
                      </span>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {nextFixture.home_team.name} vs {nextFixture.away_team.name}
                      </p>
                      <span className="text-xs text-accent font-medium">View all fixtures →</span>
                    </button>
                  )}
                  {topScorersPreview.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab(TAB_STANDINGS, "scorers")}
                      className="w-full text-left rounded-xl bg-card border border-border shadow-card p-4 hover:border-accent/40 transition-colors pressable"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Top scorers
                      </span>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {topScorersPreview
                          .map((s, i) => `${i + 1}. ${s.player.full_name} (${s.goals})`)
                          .join(" · ")}
                      </p>
                      <span className="text-xs text-accent font-medium">View top scorers →</span>
                    </button>
                  )}
                  {hasStandings && (
                    <button
                      type="button"
                      onClick={() => setTab(TAB_STANDINGS)}
                      className="w-full text-left rounded-xl bg-card border border-border shadow-card p-4 hover:border-accent/40 transition-colors pressable"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Standings
                      </span>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {standings.length} group{standings.length !== 1 ? "s" : ""} · View full table
                      </p>
                      <span className="text-xs text-accent font-medium">View standings →</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {isEmpty && (
              <section className="tournament-detail__empty py-8 flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <TrophyIcon size={20} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  {tournament.status === "upcoming"
                    ? "Waiting for teams to join. Start the tournament when ready."
                    : "No data available yet"}
                </p>
              </section>
            )}
          </div>
        )}

        {activeTab === TAB_STANDINGS && (
          <div
            id="tournament-tabpanel-standings"
            role="tabpanel"
            aria-labelledby="tournament-tab-standings"
            className="flex flex-col gap-6"
          >
            <TournamentStandings
              standingsGroups={standings}
              title={tournament.status === "upcoming" ? "Enrolled Teams" : "Standings"}
              canRemoveTeam={canManageRegistrations && tournament.raw_status === "registration"}
              canDragDrop={
                canManageRegistrations &&
                (tournament.raw_status === "registration" || tournament.raw_status === "group_stage") &&
                (tournament.format === "group_stage" || tournament.format === "round_robin")
              }
              tournamentId={tournamentId}
            />
            <div ref={scorersRef}>
              <TournamentScorers scorers={scorers} />
            </div>
          </div>
        )}

        {activeTab === TAB_FIXTURES && (
          <div
            id="tournament-tabpanel-fixtures"
            role="tabpanel"
            aria-labelledby="tournament-tab-fixtures"
          >
            <TournamentFixtures
              matches={matches}
              tournamentId={tournamentId}
              canManageSchedule={canManageRegistrations && tournament.status === "in_progress"}
              canManageKnockout={canManageRegistrations && tournament.raw_status === "knockout_stage"}
              knockoutMatches={knockoutMatches}
              advancingTeams={standings.flatMap((g) =>
                g.standings.slice(0, 2).map((s) => ({
                  id: s.team_id,
                  name: s.team.name,
                  short_name: s.team.short_name,
                }))
              )}
              onAssignSuccess={() => router.refresh()}
              userTeamId={userTeamId}
            />
          </div>
        )}

        {activeTab === TAB_BRACKET && showBracketTab && (
          <div
            id="tournament-tabpanel-bracket"
            role="tabpanel"
            aria-labelledby="tournament-tab-bracket"
          >
            <TournamentBracket
              matches={matches}
              tournamentId={tournamentId}
              canManage={canManageRegistrations}
              knockoutMode={tournament.knockout_mode}
              advancingTeams={standings.flatMap((g) =>
                g.standings.slice(0, 2).map((s) => ({
                  id: s.team_id,
                  name: s.team.name,
                  short_name: s.team.short_name,
                }))
              )}
              onAssignSuccess={() => router.refresh()}
            />
          </div>
        )}
      </main>
    </div>
  );
}

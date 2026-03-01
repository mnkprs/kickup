"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MatchesHeader } from "@/components/matches-header";
import { MatchesUpcoming } from "@/components/matches-upcoming";
import { MatchesResults } from "@/components/matches-results";
import { CreateMatchFab } from "@/components/create-match-fab";
import { BottomNav } from "@/components/bottom-nav";

function MatchesContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam === "Results" ? "Results" : "Upcoming"
  );

  useEffect(() => {
    if (tabParam === "Results") setActiveTab("Results");
  }, [tabParam]);

  return (
    <>
      <MatchesHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex flex-col gap-6 pb-24 pt-4">
        {activeTab === "Upcoming" && <MatchesUpcoming />}
        {activeTab === "Results" && <MatchesResults />}
      </main>

      <CreateMatchFab />
    </>
  );
}

export default function MatchesPage() {
  return (
    <div className="min-h-dvh bg-background max-w-lg mx-auto relative">
      <Suspense>
        <MatchesContent />
      </Suspense>
      <BottomNav />
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

const BottomNav = dynamic(
  () => import("@/components/bottom-nav").then((m) => m.BottomNav),
  { ssr: false },
);

const CreateMatchFab = dynamic(
  () => import("@/components/create-match-fab").then((m) => m.CreateMatchFab),
  { ssr: false },
);

export function LayoutNav() {
  return (
    <>
      <BottomNav />
      <CreateMatchFab />
    </>
  );
}

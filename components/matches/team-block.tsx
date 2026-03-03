"use client";

import Link from "next/link";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { isTbdTeam } from "@/lib/constants";

interface TeamBlockProps {
  team: {
    id: string;
    avatar_url?: string | null;
    emoji?: string;
    color?: string;
    short_name: string;
    name: string;
  };
  score: number | null;
  isWinner: boolean;
}

export function TeamBlock({ team, score, isWinner }: TeamBlockProps) {
  const content = (
    <>
      <TeamAvatar
        avatar_url={team.avatar_url}
        emoji={team.emoji}
        short_name={team.short_name}
        name={team.name}
        color={team.color}
        size="2xl"
      />
      <span
        className={`text-sm font-medium text-center leading-tight ${
          isWinner ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {team.name}
      </span>
      {score !== null && (
        <span
          className={`text-4xl font-bold ${
            isWinner ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {score}
        </span>
      )}
    </>
  );
  const className = "flex flex-col items-center gap-2 flex-1";
  if (isTbdTeam(team.id)) {
    return <div className={className}>{content}</div>;
  }
  return (
    <Link href={`/teams/${team.id}`} className={`${className} hover:opacity-90 transition-opacity`}>
      {content}
    </Link>
  );
}

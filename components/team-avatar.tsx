"use client";

import Image from "next/image";

import type { Team } from "@/lib/types";

export interface TeamAvatarProps {
  avatar_url?: string | null;
  emoji?: string;
  short_name: string;
  name: string;
  color?: string;
  size?: "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  /** Use a lighter background for fallback (e.g. "33" for 33% opacity) */
  colorOpacity?: string;
}

/** Convenience: pass team object instead of individual props */
export interface TeamAvatarTeamProps extends Omit<TeamAvatarProps, "avatar_url" | "emoji" | "short_name" | "name" | "color"> {
  team: Team;
}

const sizeMap = {
  "2xs": { dim: 32, class: "h-8 w-8 text-[10px]" },
  xs: { dim: 28, class: "h-7 w-7 text-[11px]" },
  sm: { dim: 36, class: "h-9 w-9 text-xs" },
  md: { dim: 44, class: "h-11 w-11 text-sm" },
  lg: { dim: 48, class: "h-12 w-12 text-sm" },
  xl: { dim: 56, class: "h-14 w-14 text-lg" },
  "2xl": { dim: 80, class: "h-20 w-20 text-xl" },
};

export function TeamAvatar(
  props: TeamAvatarProps | TeamAvatarTeamProps
) {
  const isTeamProps = "team" in props && props.team;
  const {
    avatar_url = isTeamProps ? props.team.avatar_url : undefined,
    emoji = isTeamProps ? props.team.emoji : undefined,
    short_name = isTeamProps ? props.team.short_name : "",
    name = isTeamProps ? props.team.name : "",
    color = isTeamProps ? props.team.color : "#2E7D32",
    size = "md",
    className = "",
    colorOpacity,
  } = isTeamProps
    ? { ...props, ...props.team }
    : (props as TeamAvatarProps);

  const resolvedUrl = isTeamProps ? (props as TeamAvatarTeamProps).team.avatar_url : avatar_url;
  const resolvedEmoji = isTeamProps ? (props as TeamAvatarTeamProps).team.emoji : emoji;
  const resolvedShortName = isTeamProps ? (props as TeamAvatarTeamProps).team.short_name : short_name;
  const resolvedName = isTeamProps ? (props as TeamAvatarTeamProps).team.name : name;
  const resolvedColor = isTeamProps ? (props as TeamAvatarTeamProps).team.color : color;

  return (
    <TeamAvatarInner
      avatar_url={resolvedUrl}
      emoji={resolvedEmoji}
      short_name={resolvedShortName}
      name={resolvedName}
      color={resolvedColor}
      size={size}
      className={className}
      colorOpacity={colorOpacity}
    />
  );
}

function TeamAvatarInner({
  avatar_url,
  emoji,
  short_name,
  name,
  color = "#2E7D32",
  size = "md",
  className = "",
  colorOpacity,
}: TeamAvatarProps) {
  const { dim, class: sizeClass } = sizeMap[size];
  const fallback = emoji || short_name;
  const bgColor = colorOpacity ? `${color}${colorOpacity}` : `${color}33`;

  return (
    <div
      className={`relative rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-border ${sizeClass} ${className}`}
      style={!avatar_url ? { backgroundColor: bgColor } : undefined}
    >
      {avatar_url ? (
        <Image
          src={avatar_url}
          alt={name}
          width={dim}
          height={dim}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-foreground font-bold">
          {emoji ? (
            <span className="text-[1em] leading-none">{emoji}</span>
          ) : (
            short_name
          )}
        </span>
      )}
    </div>
  );
}

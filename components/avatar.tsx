"use client";

import Image from "next/image";

export interface AvatarProps {
  avatar_url?: string | null;
  avatar_initials: string;
  avatar_color: string;
  full_name: string;
  size?: "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  /** Use a lighter background for initials (e.g. "20" for 20% opacity) */
  colorOpacity?: string;
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

export function Avatar({
  avatar_url,
  avatar_initials,
  avatar_color,
  full_name,
  size = "md",
  className = "",
  colorOpacity,
}: AvatarProps) {
  const { dim, class: sizeClass } = sizeMap[size];
  const initials =
    avatar_initials || full_name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
  const bgColor = colorOpacity
    ? `${avatar_color}${colorOpacity}`
    : avatar_color ?? "var(--color-accent)";

  return (
    <div
      className={`relative rounded-full flex items-center justify-center overflow-hidden shrink-0 ${sizeClass} ${className}`}
      style={!avatar_url ? { backgroundColor: bgColor } : undefined}
    >
      {avatar_url ? (
        <Image
          src={avatar_url}
          alt={full_name}
          width={dim}
          height={dim}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className={
            colorOpacity ? "text-foreground font-semibold" : "text-accent-foreground font-bold"
          }
        >
          {initials}
        </span>
      )}
    </div>
  );
}

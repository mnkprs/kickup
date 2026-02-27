interface PlayerAvatarProps {
  initials: string;
  color: string;
  avatarUrl?: string | null;
  size?: number;
}

export function PlayerAvatar({ initials, color, avatarUrl, size = 36 }: PlayerAvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.33,
        fontWeight: 700,
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      {initials}
    </div>
  );
}

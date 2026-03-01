interface PlayerAvatarProps {
  initials: string;
  color: string;
  avatarUrl?: string | null;
  size?: number;
  showAvailable?: boolean;
}

export function PlayerAvatar({ initials, color, avatarUrl, size = 36, showAvailable = false }: PlayerAvatarProps) {
  const badgeSize = Math.max(10, Math.round(size * 0.28));
  const inner = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={initials}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
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

  if (!showAvailable) return inner;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {inner}
      <span
        className="absolute flex items-center justify-center rounded-full"
        style={{
          width: badgeSize,
          height: badgeSize,
          top: 0,
          right: 0,
          background: '#2E7D32',
          border: '1.5px solid white',
          fontSize: badgeSize * 0.55,
          lineHeight: 1,
          color: 'white',
          fontWeight: 700,
        }}
        title="Available"
      >
        ✓
      </span>
    </div>
  );
}

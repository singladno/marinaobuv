'use client';

interface ParsingIndicatorProps {
  isActive: boolean;
  collapsed: boolean;
}

export function ParsingIndicator({
  isActive,
  collapsed,
}: ParsingIndicatorProps) {
  if (!isActive) return null;

  return (
    <div
      className={`absolute ${
        collapsed
          ? 'right-1 top-1/2 -translate-y-1/2'
          : 'right-3 top-1/2 -translate-y-1/2'
      } h-2 w-2 animate-pulse rounded-full bg-green-500`}
    >
      <div className="h-full w-full animate-ping rounded-full bg-green-500" />
    </div>
  );
}

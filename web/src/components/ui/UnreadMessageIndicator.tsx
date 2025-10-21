'use client';

interface UnreadMessageIndicatorProps {
  count: number;
  className?: string;
}

export function UnreadMessageIndicator({
  count,
  className = '',
}: UnreadMessageIndicatorProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div
      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white ${className}`}
    >
      {count > 99 ? '99+' : count}
    </div>
  );
}

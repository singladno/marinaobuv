'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';

interface ChatButtonWithIndicatorProps {
  itemId: string;
  onClick: () => void;
  unreadCount?: number;
}

export function ChatButtonWithIndicator({
  itemId,
  onClick,
  unreadCount: propUnreadCount,
}: ChatButtonWithIndicatorProps) {
  // Only fetch unread count if not provided as prop
  const { unreadCount: hookUnreadCount } = useUnreadMessageCount(
    propUnreadCount === undefined ? itemId : null
  );

  const unreadCount =
    propUnreadCount !== undefined ? propUnreadCount : hookUnreadCount;

  return (
    <div className="relative">
      <Button onClick={onClick} variant="outline" size="sm">
        <MessageSquare className="h-4 w-4" />
      </Button>

      {unreadCount > 0 && (
        <div className="absolute -top-1.5 left-8 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
}

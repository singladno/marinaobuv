'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/contexts/UserContext';
import { useClientUnreadMessageCount } from '@/hooks/useClientUnreadMessageCount';
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
  const { user } = useUser();

  // Use appropriate hook based on user role (only if no prop provided)
  const clientUnread = useClientUnreadMessageCount(
    user?.role === 'CLIENT' && propUnreadCount === undefined ? itemId : null
  );
  const adminUnread = useUnreadMessageCount(
    user?.role === 'ADMIN' && propUnreadCount === undefined ? itemId : null
  );

  // Use prop unread count if provided, otherwise use hook data
  const unreadCount =
    propUnreadCount !== undefined
      ? propUnreadCount
      : user?.role === 'ADMIN'
        ? adminUnread.unreadCount
        : clientUnread.unreadCount;

  return (
    <div className="relative">
      <Button
        onClick={onClick}
        variant="outline"
        size="sm"
        className="h-10 w-10 p-0"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      {unreadCount > 0 && (
        <div className="absolute -top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}

      {/* Show total message count for clients */}
      {user?.role === 'CLIENT' && unreadCount === 0 && (
        <div className="absolute -top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
          <MessageSquare className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

import * as React from 'react';

import { useNotifications } from './NotificationProvider';
import { NotificationToast } from './NotificationToast';

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[1000] space-y-2">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

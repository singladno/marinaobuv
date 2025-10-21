import * as React from 'react';

import type { Notification } from './NotificationProvider';
import { getNotificationStyles } from './NotificationStyles';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

export function NotificationToast({
  notification,
  onClose,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const styles = getNotificationStyles(notification);

  return (
    <div
      className={`max-w-sm transform rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${styles.container}`}
    >
      <div className="flex items-start">
        <div className={`flex flex-shrink-0 items-center ${styles.icon}`}>
          {styles.iconSvg}
        </div>
        <div className="ml-3 flex-1">
          <h4 className={`text-sm font-medium ${styles.title}`}>
            {notification.title}
          </h4>
          {notification.message && (
            <p className={`mt-1 text-sm ${styles.message}`}>
              {notification.message}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onClose}
            className={`inline-flex rounded-md ${styles.icon} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            <span className="sr-only">Закрыть</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

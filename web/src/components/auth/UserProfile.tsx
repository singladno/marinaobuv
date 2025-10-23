'use client';

import { useUser } from '@/contexts/NextAuthUserContext';
import { LogoutButton } from './LogoutButton';
import { Text } from '@/components/ui/Text';

export function UserProfile() {
  const { user, loading, logout } = useUser();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Загрузка...
        </Text>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Не авторизован
        </Text>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <Text className="text-sm font-medium text-gray-900 dark:text-white">
          {user.name || 'Пользователь'}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {user.email || user.phone || 'Без контактов'}
        </Text>
        <Text className="text-xs text-gray-400 dark:text-gray-500">
          {user.role}
        </Text>
      </div>
      <LogoutButton variant="ghost" className="text-sm">
        Выйти
      </LogoutButton>
    </div>
  );
}

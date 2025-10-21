'use client';

import { EditableRoleBadge } from '@/components/features/EditableRoleBadge';

import type { User } from './types';

interface UserTableProps {
  users: User[];
  loading: boolean;
  getRoleLabel: (role: string) => string;
  formatDate: (dateString: string) => string;
  onUpdateUser: (id: string, updates: Partial<User>) => Promise<void>;
}

export function UserTable({
  users,
  loading,
  getRoleLabel,
  formatDate,
  onUpdateUser,
}: UserTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        Пользователи не найдены
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
              Пользователь
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
              Роль
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
              Статистика
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
              Создан
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
          {users.map(user => (
            <tr
              key={user.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td className="whitespace-nowrap px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name || 'Без имени'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.phone}
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <EditableRoleBadge
                  role={user.role}
                  onRoleChange={async newRole =>
                    onUpdateUser(user.id, { role: newRole })
                  }
                />
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                <div className="flex gap-4">
                  <span>{user._count.orders} заказов</span>
                  <span>{user._count.reviews} отзывов</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(user.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

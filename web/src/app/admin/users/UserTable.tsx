'use client';

import { useState } from 'react';
import { EditableRoleBadge } from '@/components/features/EditableRoleBadge';
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal';

import type { User } from './types';

interface UserTableProps {
  users: User[];
  loading: boolean;
  getRoleLabel: (role: string) => string;
  formatDate: (dateString: string) => string;
  onUpdateUser: (id: string, updates: Partial<User>) => Promise<void>;
  onPasswordChanged?: () => void;
}

export function UserTable({
  users,
  loading,
  getRoleLabel,
  formatDate,
  onUpdateUser,
  onPasswordChanged,
}: UserTableProps) {
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  }>({
    isOpen: false,
    userId: '',
    userName: '',
  });

  const handlePasswordChange = (userId: string, userName: string) => {
    setPasswordModal({
      isOpen: true,
      userId,
      userName,
    });
  };

  const handlePasswordModalClose = () => {
    setPasswordModal({
      isOpen: false,
      userId: '',
      userName: '',
    });
  };

  const handlePasswordChangedCallback = () => {
    onPasswordChanged?.();
  };
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
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map(user => (
            <div
              key={user.id}
              className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-base font-medium text-gray-900 dark:text-white">
                      {user.name || 'Без имени'}
                    </div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {user.phone}
                    </div>
                    {user.email && (
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    )}
                  </div>
                  <EditableRoleBadge
                    role={user.role}
                    onRoleChange={async newRole =>
                      onUpdateUser(user.id, { role: newRole })
                    }
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-4 text-gray-600 dark:text-gray-400">
                    <span>{user._count.orders} заказов</span>
                    <span>{user._count.reviews} отзывов</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(user.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() =>
                    handlePasswordChange(user.id, user.name || 'Без имени')
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-100 px-3 py-2 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
                  title="Изменить пароль"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  Изменить пароль
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto overflow-y-visible">
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Действия
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
                    {user.email && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    )}
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
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() =>
                      handlePasswordChange(user.id, user.name || 'Без имени')
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
                    title="Изменить пароль"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    Пароль
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={passwordModal.isOpen}
        onClose={handlePasswordModalClose}
        userId={passwordModal.userId}
        userName={passwordModal.userName}
        onPasswordChanged={handlePasswordChangedCallback}
      />
    </>
  );
}

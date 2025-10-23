'use client';

import { useUser } from '@/contexts/NextAuthUserContext';
import { UserProfile } from '@/components/auth/UserProfile';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import Link from 'next/link';

export default function TestAuthPage() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <Text className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Загрузка...
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Тест системы аутентификации
          </h1>

          <div className="space-y-6">
            {/* User Profile */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                Профиль пользователя
              </h2>
              <UserProfile />
            </div>

            {/* User Details */}
            {user && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Детали пользователя
                </h2>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <pre className="text-sm text-gray-800 dark:text-gray-200">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex space-x-4">
              <Link href="/">
                <Button variant="outline">На главную</Button>
              </Link>
            </div>

            {/* Instructions */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                Инструкции по тестированию:
              </h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>
                  • Нажмите на иконку профиля в шапке сайта для
                  входа/регистрации
                </li>
                <li>• Попробуйте зарегистрироваться с email/паролем</li>
                <li>• Попробуйте войти через Google OAuth</li>
                <li>
                  • Проверьте, что данные пользователя отображаются корректно
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

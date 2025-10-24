'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Text } from '@/components/ui/Text';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Недействительная ссылка для восстановления пароля');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка изменения пароля');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Произошла ошибка при изменении пароля');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <svg
            className="h-6 w-6 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <Text className="text-lg font-medium text-gray-900 dark:text-white">
          Пароль изменен!
        </Text>
        <Text className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ваш пароль был успешно изменен. Теперь вы можете войти в систему.
        </Text>
        <Button
          type="button"
          onClick={() => router.push('/')}
          className="mt-4 w-full"
        >
          Перейти к входу
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Text className="text-lg font-medium text-gray-900 dark:text-white">
          Новый пароль
        </Text>
        <Text className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Введите новый пароль для вашего аккаунта
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Новый пароль
          </label>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Минимум 6 символов"
            required
            disabled={isLoading}
            minLength={6}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Подтвердите пароль
          </label>
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Повторите пароль"
            required
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <Text className="text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || !token}>
          {isLoading ? 'Изменение...' : 'Изменить пароль'}
        </Button>
      </form>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-6 w-6 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
            <div className="mx-auto mb-2 h-6 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
            <div className="mx-auto h-4 w-64 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
          </div>
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}

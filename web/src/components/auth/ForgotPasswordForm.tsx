'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function ForgotPasswordForm({
  onSuccess,
  onBack,
}: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка отправки письма');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Произошла ошибка при отправке письма');
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
          Письмо отправлено!
        </Text>
        <Text className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Проверьте вашу почту и следуйте инструкциям для восстановления пароля
        </Text>
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="mt-4 w-full"
          >
            Вернуться к входу
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Text className="text-lg font-medium text-gray-900 dark:text-white">
          Восстановление пароля
        </Text>
        <Text className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Введите ваш email для получения инструкций по восстановлению пароля
        </Text>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <Input
            type="email"
            placeholder="Введите ваш email"
            value={email}
            onChange={e => setEmail(e.target.value)}
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Отправка...' : 'Отправить инструкции'}
        </Button>
      </form>

      {onBack && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full"
          disabled={isLoading}
        >
          Вернуться к входу
        </Button>
      )}
    </div>
  );
}

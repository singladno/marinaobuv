'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { PhoneInput } from './PhoneInput';

interface ModernRegisterFormProps {
  onSuccess?: () => void;
}

export function ModernRegisterForm({ onSuccess }: ModernRegisterFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registerMethod, setRegisterMethod] = useState<'email' | 'phone'>(
    'email'
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }

      if (formData.password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов');
        return;
      }

      const registrationData =
        registerMethod === 'email'
          ? {
              name: formData.name,
              email: formData.email,
              password: formData.password,
            }
          : {
              name: formData.name,
              phone: formData.phone,
              password: formData.password,
            };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка регистрации');
        return;
      }

      setSuccess(true);

      // Auto sign in after successful registration
      const signInResult = await signIn('credentials', {
        ...registrationData,
        redirect: false,
      });

      if (signInResult?.ok) {
        onSuccess?.();
        router.push('/');
      }
    } catch (err) {
      setError('Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      setError('Ошибка входа через Google');
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
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
          Регистрация успешна!
        </Text>
        <Text className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Вы будете перенаправлены на главную страницу
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Registration Method Toggle */}
      <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
        <button
          type="button"
          onClick={() => setRegisterMethod('email')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            registerMethod === 'email'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setRegisterMethod('phone')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            registerMethod === 'phone'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
          }`}
        >
          Телефон
        </button>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Имя
          </label>
          <Input
            type="text"
            placeholder="Введите ваше имя"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            required
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Email/Phone Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {registerMethod === 'email' ? 'Email' : 'Телефон'}
          </label>
          {registerMethod === 'email' ? (
            <Input
              type="email"
              placeholder="Введите ваш email"
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
          ) : (
            <PhoneInput
              value={formData.phone}
              onChange={value => handleInputChange('phone', value || '')}
              disabled={isLoading}
              className="w-full"
              placeholder="Введите номер телефона"
            />
          )}
        </div>

        {/* Password Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Пароль
            </label>
            <Input
              type="password"
              placeholder="Минимум 6 символов"
              value={formData.password}
              onChange={e => handleInputChange('password', e.target.value)}
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
            <Input
              type="password"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={e =>
                handleInputChange('confirmPassword', e.target.value)
              }
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <Text className="text-sm text-red-600 dark:text-red-400">
              {error}
            </Text>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            или
          </span>
        </div>
      </div>

      {/* Google Sign In Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full"
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Зарегистрироваться через Google
      </Button>
    </div>
  );
}

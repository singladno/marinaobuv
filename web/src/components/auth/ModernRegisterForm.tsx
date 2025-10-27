'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Имя обязательно для заполнения';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email обязателен для заполнения';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Введите корректный email адрес';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Телефон обязателен для заполнения';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Пароль обязателен для заполнения';
    } else if (formData.password.length < 6) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Подтверждение пароля обязательно';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      if (!validateForm()) {
        setIsLoading(false);
        return;
      }

      const registrationData = {
        name: formData.name,
        email: formData.email,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (success) {
    return (
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <svg
            className="h-5 w-5 text-green-600 dark:text-green-400"
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
        <Text className="text-base font-medium text-gray-900 dark:text-white">
          Регистрация успешна!
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Вы будете перенаправлены на главную страницу
        </Text>
      </div>
    );
  }

  // Error message component - always reserves space to prevent layout shift
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="mt-0.5 flex min-h-[14px] items-center space-x-1">
      {message && (
        <>
          <svg
            className="h-3 w-3 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <Text className="text-xs text-red-600 dark:text-red-400">
            {message}
          </Text>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-2" noValidate>
        {/* Name Field */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Имя
          </label>
          <Input
            type="text"
            placeholder="Введите ваше имя"
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            disabled={isLoading}
            className={`w-full ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          <ErrorMessage message={fieldErrors.name || ''} />
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <Input
            type="email"
            placeholder="Введите ваш email"
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            disabled={isLoading}
            className={`w-full ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          />
          <ErrorMessage message={fieldErrors.email || ''} />
        </div>

        {/* Phone Field */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Телефон
          </label>
          <PhoneInput
            value={formData.phone}
            onChange={value => handleInputChange('phone', value || '')}
            disabled={isLoading}
            className={`w-full ${fieldErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            placeholder="Введите номер телефона"
          />
          <ErrorMessage message={fieldErrors.phone || ''} />
        </div>

        {/* Password Fields */}
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Придумайте пароль
            </label>
            <PasswordInput
              value={formData.password}
              onChange={password => handleInputChange('password', password)}
              placeholder="Минимум 6 символов"
              disabled={isLoading}
              minLength={6}
              className={`w-full ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            <ErrorMessage message={fieldErrors.password || ''} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Подтвердите пароль
            </label>
            <PasswordInput
              value={formData.confirmPassword}
              onChange={confirmPassword =>
                handleInputChange('confirmPassword', confirmPassword)
              }
              placeholder="Повторите пароль"
              disabled={isLoading}
              className={`w-full ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            <ErrorMessage message={fieldErrors.confirmPassword || ''} />
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
    </div>
  );
}

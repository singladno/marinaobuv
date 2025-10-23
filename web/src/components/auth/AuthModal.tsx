'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModernLoginForm } from './ModernLoginForm';
import { ModernRegisterForm } from './ModernRegisterForm';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const searchParams = useSearchParams();

  // Handle URL parameters for initial mode
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setIsLogin(false);
    } else if (mode === 'login') {
      setIsLogin(true);
    }
  }, [searchParams]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid min-h-screen place-content-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Закрыть"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800 dark:ring-white/10">
          <div className="px-8 py-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLogin ? 'Вход в систему' : 'Регистрация'}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isLogin
                  ? 'Войдите в свой аккаунт или создайте новый'
                  : 'Создайте новый аккаунт для доступа к системе'}
              </p>
            </div>

            {/* Auth Form */}
            {isLogin ? (
              <ModernLoginForm onSuccess={onClose} />
            ) : (
              <ModernRegisterForm onSuccess={onClose} />
            )}

            {/* Toggle between login and register */}
            <div className="mt-6 text-center">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              </Text>
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {isLogin ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

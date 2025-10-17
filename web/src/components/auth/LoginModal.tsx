'use client';

import { useState } from 'react';

import { LoginForm } from './LoginForm';
import { useLoginPage } from '@/hooks/useLoginPage';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const {
    phone,
    codeSent,
    code,
    error,
    loading,
    setPhone,
    setCode,
    handleSubmit,
    handleOtpResend,
    handleBackToPhone,
  } = useLoginPage({ disableRedirect: true });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid min-h-screen place-content-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
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
                {!codeSent ? 'Вход в систему' : 'Подтверждение входа'}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {!codeSent
                  ? 'Введите номер телефона для получения SMS-кода'
                  : 'Введите код из SMS для завершения входа'}
              </p>
            </div>

            {/* Login Form */}
            <LoginForm
              phone={phone}
              codeSent={codeSent}
              code={code}
              error={error}
              loading={loading}
              setPhone={setPhone}
              setCode={setCode}
              handleSubmit={handleSubmit}
              handleOtpResend={handleOtpResend}
              handleBackToPhone={handleBackToPhone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

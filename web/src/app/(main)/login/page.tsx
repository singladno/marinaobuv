'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { Text } from '@/components/ui/Text';
import { useLoginPage } from '@/hooks/useLoginPage';

export default function LoginPage() {
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
  } = useLoginPage();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="rounded-2xl bg-white/80 shadow-xl ring-1 ring-black/5 backdrop-blur-sm dark:bg-gray-800/80 dark:ring-white/10">
          <div className="px-8 py-10">
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

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 MarinaObuv. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  );
}

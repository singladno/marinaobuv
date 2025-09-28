'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { Text } from '@/components/ui/Text';
import { useLoginPage } from '@/hooks/useLoginPage';

export default function LoginPage() {
  const {
    phone,
    password,
    useOtp,
    codeSent,
    code,
    error,
    loading,
    setPhone,
    setPassword,
    setUseOtp,
    setCode,
    handleSubmit,
    handleOtpResend,
    handleBackToPhone,
  } = useLoginPage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Text variant="h2" className="text-center text-3xl font-bold">
            Вход в систему
          </Text>
          <Text className="text-muted-foreground text-center">
            Выберите способ входа
          </Text>
        </div>

        <LoginForm
          phone={phone}
          password={password}
          useOtp={useOtp}
          codeSent={codeSent}
          code={code}
          error={error}
          loading={loading}
          setPhone={setPhone}
          setPassword={setPassword}
          setUseOtp={setUseOtp}
          setCode={setCode}
          handleSubmit={handleSubmit}
          handleOtpResend={handleOtpResend}
          handleBackToPhone={handleBackToPhone}
        />
      </div>
    </div>
  );
}

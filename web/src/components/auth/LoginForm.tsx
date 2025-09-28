import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';

import { LoginMethodToggle } from './LoginMethodToggle';
import { OtpCodeInput } from './OtpCodeInput';
import { PasswordInput } from './PasswordInput';

interface LoginFormProps {
  phone: string;
  password: string;
  useOtp: boolean;
  codeSent: boolean;
  code: string;
  error: string | null;
  loading: boolean;
  setPhone: (phone: string) => void;
  setPassword: (password: string) => void;
  setUseOtp: (useOtp: boolean) => void;
  setCode: (code: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleOtpResend: () => void;
  handleBackToPhone: () => void;
}

export function LoginForm({
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
}: LoginFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Phone Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Номер телефона
        </label>
        <PhoneInput
          value={phone}
          onChange={setPhone}
          placeholder="+7 (999) 123-45-67"
          className="mt-1"
          required
        />
      </div>

      {/* Login Method Toggle */}
      <LoginMethodToggle useOtp={useOtp} setUseOtp={setUseOtp} />

      {/* Password Input (when not using OTP) */}
      {!useOtp && (
        <PasswordInput password={password} setPassword={setPassword} />
      )}

      {/* OTP Code Input (when using OTP and code sent) */}
      {useOtp && codeSent && (
        <OtpCodeInput
          code={code}
          setCode={setCode}
          loading={loading}
          handleOtpResend={handleOtpResend}
          handleBackToPhone={handleBackToPhone}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={loading} className="w-full">
        {loading
          ? 'Загрузка...'
          : useOtp && !codeSent
            ? 'Отправить код'
            : 'Войти'}
      </Button>
    </form>
  );
}

import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';

import { OtpCodeInput } from './OtpCodeInput';

interface LoginFormProps {
  phone: string;
  codeSent: boolean;
  code: string;
  error: string | null;
  loading: boolean;
  setPhone: (phone: string) => void;
  setCode: (code: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleOtpResend: () => void;
  handleBackToPhone: () => void;
}

export function LoginForm({
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
}: LoginFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Phone Input */}
      {!codeSent && (
        <div className="space-y-2">
          <div className="relative">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              placeholder="+7 (999) 123-45-67"
              className="w-full"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* OTP Code Input (when code sent) */}
      {codeSent && (
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start">
            <svg
              className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Ошибка
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg
                className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Загрузка...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              {!codeSent ? 'Получить код' : 'Войти'}
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}

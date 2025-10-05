import { Input } from '@/components/ui/Input';

interface OtpCodeInputProps {
  code: string;
  setCode: (code: string) => void;
  loading: boolean;
  handleOtpResend: () => void;
  handleBackToPhone: () => void;
}

export function OtpCodeInput({
  code,
  setCode,
  loading,
  handleOtpResend,
  handleBackToPhone,
}: OtpCodeInputProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Код из SMS
        </label>
        <div className="relative">
          <Input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Введите 6-значный код"
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-center text-2xl font-bold tracking-widest text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
            maxLength={6}
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
        <button
          type="button"
          onClick={handleOtpResend}
          disabled={loading}
          className="flex-1 rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-all duration-200 hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
        >
          <div className="flex items-center justify-center">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Отправить код повторно
          </div>
        </button>

        <button
          type="button"
          onClick={handleBackToPhone}
          className="flex-1 rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <div className="flex items-center justify-center">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Изменить номер
          </div>
        </button>
      </div>
    </div>
  );
}

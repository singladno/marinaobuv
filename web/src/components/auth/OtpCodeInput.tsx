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
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Код из SMS
      </label>
      <Input
        type="text"
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Введите код из SMS"
        className="mt-1"
        maxLength={6}
        required
      />
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={handleOtpResend}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Отправить код повторно
        </button>
        <button
          type="button"
          onClick={handleBackToPhone}
          className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Изменить номер
        </button>
      </div>
    </div>
  );
}

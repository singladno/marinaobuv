import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPhoneNumber } from '@/utils/phoneMask';

interface OtpInputStepProps {
  phone: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  onLogin: (phone: string, otpCode: string) => Promise<void>;
  onResendOtp: (phone: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function OtpInputStep({
  phone,
  otpCode,
  setOtpCode,
  onLogin,
  onResendOtp,
  loading,
  error,
}: OtpInputStepProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length >= 4) {
      await onLogin(phone, otpCode);
    }
  };

  const handleResend = async () => {
    await onResendOtp(phone);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Код подтверждения
        </label>
        <Input
          type="text"
          value={otpCode}
          onChange={e => setOtpCode(e.target.value)}
          className="w-full text-center text-lg tracking-widest"
          placeholder="1234"
          maxLength={6}
          required
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Введите код, отправленный на номер {formatPhoneNumber(phone)}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Button
          type="submit"
          disabled={loading || otpCode.length < 4}
          className="w-full"
        >
          {loading ? 'Вход...' : 'Войти'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={loading}
          className="w-full"
        >
          Отправить код повторно
        </Button>
      </div>
    </form>
  );
}

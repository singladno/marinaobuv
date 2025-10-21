import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/ui/PhoneInput';

interface PhoneInputStepProps {
  phone: string;
  setPhone: (phone: string) => void;
  onSendOtp: (phone: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function PhoneInputStep({
  phone,
  setPhone,
  onSendOtp,
  loading,
  error,
}: PhoneInputStepProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      await onSendOtp(phone);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Номер телефона
        </label>
        <PhoneInput
          value={phone}
          onChange={setPhone}
          className="w-full"
          placeholder="+7 (999) 123-45-67"
          required
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || phone.length < 10}
        className="w-full"
      >
        {loading ? 'Отправка...' : 'Отправить код'}
      </Button>
    </form>
  );
}

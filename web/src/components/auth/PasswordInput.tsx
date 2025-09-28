import { Input } from '@/components/ui/Input';

interface PasswordInputProps {
  password: string;
  setPassword: (password: string) => void;
}

export function PasswordInput({ password, setPassword }: PasswordInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Пароль
      </label>
      <Input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="mt-1"
        required
      />
    </div>
  );
}

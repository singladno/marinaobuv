'use client';

import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

import type { CreateUserFormData, Provider } from './types';

interface CreateUserFormProps {
  formData: CreateUserFormData;
  setFormData: (data: CreateUserFormData) => void;
  providers: Provider[];
  onSubmit: (e: React.FormEvent) => void;
  creating: boolean;
}

export function CreateUserForm({
  formData,
  setFormData,
  providers,
  onSubmit,
  creating,
}: CreateUserFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 p-6">
      <div className="w-full">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email *
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
          className="w-full"
          required
        />
      </div>

      <div className="w-full">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Телефон
        </label>
        <PhoneInput
          value={formData.phone}
          onChange={phone => setFormData({ ...formData, phone })}
          className="w-full"
        />
      </div>

      <div className="w-full">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Имя
        </label>
        <Input
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="Имя пользователя"
          className="w-full"
        />
      </div>

      <div className="w-full">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Пароль *
        </label>
        <PasswordInput
          value={formData.password}
          onChange={password => setFormData({ ...formData, password })}
          placeholder="Минимум 6 символов"
          className="w-full"
          required
          minLength={6}
        />
      </div>

      <div className="w-full">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Подтвердите пароль *
        </label>
        <PasswordInput
          value={formData.confirmPassword}
          onChange={confirmPassword =>
            setFormData({ ...formData, confirmPassword })
          }
          placeholder="Повторите пароль"
          className="w-full"
          required
        />
      </div>

      <div className="w-full">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Роль *
        </label>
        <Select
          value={formData.role}
          onValueChange={role => setFormData({ ...formData, role })}
        >
          <SelectTrigger className="w-full" aria-label="Выберите роль">
            <SelectValue placeholder="Выберите роль" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Администратор</SelectItem>
            <SelectItem value="PROVIDER">Поставщик</SelectItem>
            <SelectItem value="GRUZCHIK">Грузчик</SelectItem>
            <SelectItem value="CLIENT">Клиент</SelectItem>
            <SelectItem value="EXPORT_MANAGER">Менеджер экспорта</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.role === 'PROVIDER' && (
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Поставщик *
          </label>
          <Select
            value={formData.providerId}
            onValueChange={providerId =>
              setFormData({ ...formData, providerId })
            }
          >
            <SelectTrigger className="w-full" aria-label="Выберите поставщика">
              <SelectValue placeholder="Выберите поставщика" />
            </SelectTrigger>
            <SelectContent>
              {providers.map(provider => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {creating ? 'Создание...' : 'Создать'}
        </button>
      </div>
    </form>
  );
}

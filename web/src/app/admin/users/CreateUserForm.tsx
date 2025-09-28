'use client';

import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';

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
          Телефон *
        </label>
        <PhoneInput
          value={formData.phone}
          onChange={phone => setFormData({ ...formData, phone })}
          className="w-full"
          required
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
          Роль *
        </label>
        <select
          value={formData.role}
          onChange={e => setFormData({ ...formData, role: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          required
          aria-label="Выберите роль"
        >
          <option value="">Выберите роль</option>
          <option value="ADMIN">Администратор</option>
          <option value="PROVIDER">Поставщик</option>
          <option value="GRUZCHIK">Грузчик</option>
          <option value="CLIENT">Клиент</option>
        </select>
      </div>

      {formData.role === 'PROVIDER' && (
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Поставщик *
          </label>
          <select
            value={formData.providerId}
            onChange={e =>
              setFormData({ ...formData, providerId: e.target.value })
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required={formData.role === 'PROVIDER'}
            aria-label="Выберите поставщика"
          >
            <option value="">Выберите поставщика</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
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

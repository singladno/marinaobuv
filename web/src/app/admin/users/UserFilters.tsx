'use client';

import { Input } from '@/components/ui/Input';

interface UserFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
}

export function UserFilters({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
}: UserFiltersProps) {
  return (
    <div className="flex gap-4">
      <Input
        placeholder="Поиск по имени или телефону..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <select
        value={roleFilter}
        onChange={e => setRoleFilter(e.target.value)}
        className="w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        aria-label="Фильтр по роли"
      >
        <option value="">Все роли</option>
        <option value="ADMIN">Администратор</option>
        <option value="PROVIDER">Поставщик</option>
        <option value="GRUZCHIK">Грузчик</option>
        <option value="CLIENT">Клиент</option>
      </select>
    </div>
  );
}

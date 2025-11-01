'use client';

import { SearchInput } from '@/components/ui/SearchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

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
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Поиск по имени или телефону..."
        className="w-full sm:max-w-sm"
      />
      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <SelectTrigger className="w-full sm:w-48" aria-label="Фильтр по роли">
          <SelectValue placeholder="Все роли" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Все роли</SelectItem>
          <SelectItem value="ADMIN">Администратор</SelectItem>
          <SelectItem value="PROVIDER">Поставщик</SelectItem>
          <SelectItem value="GRUZCHIK">Грузчик</SelectItem>
          <SelectItem value="CLIENT">Клиент</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

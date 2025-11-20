'use client';

import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface EditableRoleBadgeProps {
  role: string;
  onRoleChange: (newRole: string) => Promise<void>;
  disabled?: boolean;
}

const roleOptions = [
  { value: 'ADMIN', label: 'Администратор' },
  { value: 'CLIENT', label: 'Клиент' },
  { value: 'PROVIDER', label: 'Поставщик' },
  { value: 'GRUZCHIK', label: 'Грузчик' },
];

export function EditableRoleBadge({
  role,
  onRoleChange,
  disabled = false,
}: EditableRoleBadgeProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === role || isUpdating) return;

    setIsUpdating(true);
    try {
      await onRoleChange(newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentRole = roleOptions.find(option => option.value === role);

  return (
    <div className="relative">
      <Select
        value={role}
        onValueChange={handleRoleChange}
        disabled={disabled || isUpdating}
      >
        <SelectTrigger
          className="h-6 w-auto min-w-[150px] cursor-pointer border-0 bg-blue-100 px-3 py-0 text-xs font-medium text-blue-800 shadow-none hover:bg-blue-200 focus:ring-1 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          aria-label="Изменить роль"
        >
          <SelectValue>
            <span className="flex items-center gap-1">
              {currentRole?.label || role}
              {isUpdating && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {roleOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

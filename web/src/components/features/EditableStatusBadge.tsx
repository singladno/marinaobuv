'use client';

import * as React from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { ORDER_STATUSES, getStatusConfig } from '@/lib/order-statuses';

interface EditableStatusBadgeProps {
  status: string;
  onStatusChange: (newStatus: string) => Promise<void>;
  disabled?: boolean;
}

export function EditableStatusBadge({
  status,
  onStatusChange,
  disabled = false,
}: EditableStatusBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentStatus = getStatusConfig(status);

  const ariaExpanded = isOpen ? 'true' : 'false';

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status || isUpdating) return;

    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUpdating) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div
      className="relative"
      ref={dropdownRef}
      data-interactive="true"
      onClick={e => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || isUpdating}
        className={`
          inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium
          transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          ${currentStatus.color}
          ${disabled || isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
          ${isUpdating ? 'animate-pulse' : ''}
        `}
        aria-label={`Изменить статус с ${currentStatus.label}`}
      >
        <span>{currentStatus.label}</span>
        {!disabled && !isUpdating && (
          <ChevronDownIcon
            className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
        {isUpdating && (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
          title="Выберите новый статус заказа"
        >
          <ul className="py-1" title="Список статусов заказа">
            {ORDER_STATUSES.map(option => (
              <li
                key={option.value}
                tabIndex={0}
                onClick={() => handleStatusChange(option.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleStatusChange(option.value);
                  }
                }}
                className={`
                  cursor-pointer px-3 py-2 text-xs transition-colors duration-150
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  ${option.value === status ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'}
                `}
              >
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 text-xs ${option.color}`}
                >
                  {option.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

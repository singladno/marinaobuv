'use client';

import * as React from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface Gruzchik {
  id: string;
  name: string | null;
  phone: string | null;
}

interface EditableGruzchikSelectorProps {
  value: string | null;
  gruzchiks: Gruzchik[];
  onGruzchikChange: (newGruzchikId: string | null) => Promise<void>;
  disabled?: boolean;
}

export function EditableGruzchikSelector({
  value,
  gruzchiks,
  onGruzchikChange,
  disabled = false,
}: EditableGruzchikSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentGruzchik = gruzchiks.find(g => g.id === value);
  const displayText = currentGruzchik
    ? currentGruzchik.name || currentGruzchik.phone || currentGruzchik.id
    : 'Не назначен';

  const ariaExpanded = isOpen ? 'true' : 'false';

  const handleGruzchikChange = async (newGruzchikId: string | null) => {
    if (newGruzchikId === value || isUpdating) return;

    setIsUpdating(true);
    try {
      await onGruzchikChange(newGruzchikId);
    } catch (error) {
      console.error('Failed to update gruzchik:', error);
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
          ${value ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-300' : 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}
          ${disabled || isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
          ${isUpdating ? 'animate-pulse' : ''}
        `}
        aria-label={`Изменить грузчика с ${displayText}`}
      >
        <span>{displayText}</span>
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
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleGruzchikChange(null)}
              className={`
                block w-full px-3 py-2 text-left text-sm transition-colors
                ${!value ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}
              `}
            >
              Не назначен
            </button>
            {gruzchiks.map(gruzchik => (
              <button
                key={gruzchik.id}
                type="button"
                onClick={() => handleGruzchikChange(gruzchik.id)}
                className={`
                  block w-full px-3 py-2 text-left text-sm transition-colors
                  ${value === gruzchik.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}
                `}
              >
                {gruzchik.name || gruzchik.phone || gruzchik.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

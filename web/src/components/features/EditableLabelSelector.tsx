'use client';

import * as React from 'react';
import { PencilIcon } from '@heroicons/react/20/solid';

interface EditableLabelSelectorProps {
  value: string | null;
  onLabelChange: (newLabel: string | null) => Promise<void>;
  disabled?: boolean;
}

export function EditableLabelSelector({
  value,
  onLabelChange,
  disabled = false,
}: EditableLabelSelectorProps) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value || '');
  const [isEditing, setIsEditing] = React.useState(false);
  const [status, setStatus] = React.useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayText = value || 'Добавить метку';

  React.useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleClick = (e?: React.MouseEvent) => {
    // prevent row navigation
    e?.stopPropagation();
    if (!disabled && !isUpdating) {
      setIsEditing(true);
      setEditValue(value || '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSave = async () => {
    const trimmed = editValue.trim() || null;
    if (trimmed === value) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    setStatus('saving');
    try {
      await onLabelChange(trimmed);
      setStatus('idle');
      setIsEditing(false);
    } catch (error) {
      setStatus('error');
      setEditValue(value || '');
      // Clear error status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'saving':
        return (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        );
      case 'error':
        return (
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500">
            <svg
              className="h-2 w-2 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  if (isEditing) {
    return (
      <div
        className="relative"
        data-interactive="true"
        onClick={e => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`w-full min-w-[220px] rounded border px-2 py-1 text-sm transition-colors focus:outline-none ${
            isUpdating
              ? 'border-violet-300 bg-violet-50 text-gray-500 dark:border-violet-600 dark:bg-violet-900/20 dark:text-gray-400'
              : 'border-gray-300 bg-white focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
          }`}
          placeholder="Метка"
          disabled={isUpdating}
        />
        {status !== 'idle' && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {getStatusIndicator()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative"
      data-interactive="true"
      onClick={e => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUpdating}
        className={`
          inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium
          transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          ${value ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/20 dark:text-green-300' : 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}
          ${disabled || isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
          ${isUpdating ? 'animate-pulse' : ''}
        `}
        aria-label={`Изменить метку: ${displayText}`}
      >
        <span className="max-w-[200px] truncate">{displayText}</span>
        {!disabled && !isUpdating && <PencilIcon className="h-3 w-3" />}
        {isUpdating && (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
      </button>
      {status !== 'idle' && !isEditing && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {getStatusIndicator()}
        </div>
      )}
    </div>
  );
}

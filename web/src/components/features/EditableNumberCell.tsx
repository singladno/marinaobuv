import * as React from 'react';

import { validateNumberInput } from '@/utils/numberValidation';

interface EditableNumberCellProps {
  value: number | null;
  onBlur: (value: number | null) => void;
  placeholder?: string;
  'aria-label': string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function EditableNumberCell({
  value,
  onBlur,
  placeholder = 'Введите число',
  'aria-label': ariaLabel,
  min,
  max,
  disabled = false,
}: EditableNumberCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(
    value !== null ? value.toString() : ''
  );

  React.useEffect(() => {
    setEditValue(value !== null ? value.toString() : '');
  }, [value]);

  const handleSave = () => {
    const validation = validateNumberInput(editValue, min, max);

    if (validation.shouldRevert) {
      setEditValue(value !== null ? value.toString() : '');
      setIsEditing(false);
      return;
    }

    onBlur(validation.value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value !== null ? value.toString() : '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        min={min}
        max={max}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      className={`w-full text-center ${
        disabled
          ? 'cursor-not-allowed text-gray-400 dark:text-gray-500'
          : 'text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400'
      }`}
      aria-label={ariaLabel}
    >
      {value !== null ? (
        <span className="font-medium">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
      )}
    </button>
  );
}

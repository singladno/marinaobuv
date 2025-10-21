import * as React from 'react';

interface EditablePriceCellProps {
  value: number | null; // Value in rubles
  onBlur: (value: number | null) => void; // Callback with value in rubles
  placeholder?: string;
  'aria-label': string;
  disabled?: boolean;
}

export function EditablePriceCell({
  value,
  onBlur,
  placeholder = 'Введите сумму',
  'aria-label': ariaLabel,
  disabled = false,
}: EditablePriceCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(
    value !== null ? value.toString() : ''
  );

  React.useEffect(() => {
    setEditValue(value !== null ? value.toString() : '');
  }, [value]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue === '') {
      onBlur(null);
    } else {
      const rubles = parseFloat(trimmedValue);
      if (!isNaN(rubles) && rubles >= 0) {
        onBlur(rubles);
      } else {
        // Invalid input, revert to original value
        setEditValue(value !== null ? value.toString() : '');
      }
    }
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
        step="0.01"
        min="0"
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

  const displayValue = value !== null ? value.toLocaleString('ru-RU') : null;

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      className={`w-full text-left ${
        disabled
          ? 'cursor-not-allowed text-gray-400 dark:text-gray-500'
          : 'text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400'
      }`}
      aria-label={ariaLabel}
    >
      {displayValue ? (
        <span className="font-medium">{displayValue}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
      )}
    </button>
  );
}

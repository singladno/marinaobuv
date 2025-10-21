import * as React from 'react';

interface EditableCellProps {
  value: string | null;
  onBlur: (value: string | null) => void;
  placeholder: string;
  'aria-label': string;
  disabled?: boolean;
}

export function EditableCell({
  value,
  onBlur,
  placeholder,
  'aria-label': ariaLabel,
  disabled = false,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value || '');

  React.useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = () => {
    const trimmedValue = editValue.trim() || null;
    onBlur(trimmedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
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
        type="text"
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
      className={`w-full text-left ${
        disabled
          ? 'cursor-not-allowed text-gray-400 dark:text-gray-500'
          : 'text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400'
      }`}
      aria-label={ariaLabel}
    >
      {value || (
        <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
      )}
    </button>
  );
}

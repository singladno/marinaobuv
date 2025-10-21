export function formatDisplayValue(
  val: string | number | null,
  type: 'text' | 'number' | 'price' = 'text',
  placeholder: string = '—'
): string {
  if (val === null || val === '') return placeholder;

  if (type === 'price' && typeof val === 'number') {
    return val.toLocaleString('ru-RU');
  }

  return String(val);
}

interface InputPropsParams {
  editValue: string;
  setEditValue: (value: string) => void;
  handleBlur: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  className: string;
  isSaving: boolean;
  ariaLabel?: string;
}

export function getInputProps({
  editValue,
  setEditValue,
  handleBlur,
  handleKeyDown,
  placeholder,
  className,
  isSaving,
  ariaLabel,
}: InputPropsParams) {
  return {
    value: editValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setEditValue(e.target.value),
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    placeholder,
    className: `w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white ${className}`,
    autoFocus: true,
    disabled: isSaving,
    'aria-label': ariaLabel,
  };
}

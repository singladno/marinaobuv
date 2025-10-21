import * as React from 'react';

interface GenderSelectCellProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

const GENDER_OPTIONS = [
  { value: 'FEMALE', label: 'Женская' },
  { value: 'MALE', label: 'Мужская' },
];

export function GenderSelectCell({
  value,
  onChange,
  disabled = false,
}: GenderSelectCellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const selectedOption = GENDER_OPTIONS.find(
    option => option.value === localValue
  );

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    setLocalValue(optionValue);
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    if (disabled) return;
    setLocalValue(null);
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
      >
        {selectedOption ? selectedOption.label : 'Выберите пол'}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
            <div className="py-1">
              <button
                type="button"
                onClick={handleClear}
                className="block w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
              >
                Очистить
              </button>
              {GENDER_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${
                    localValue === option.value
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

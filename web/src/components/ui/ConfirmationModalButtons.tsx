import * as React from 'react';

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmationModalButtonsProps {
  onClose: () => void;
  onConfirm: () => void;
  confirmText: string;
  cancelText: string;
  variant: Variant;
  isLoading: boolean;
}

export function ConfirmationModalButtons({
  onClose,
  onConfirm,
  confirmText,
  cancelText,
  variant,
  isLoading,
}: ConfirmationModalButtonsProps) {
  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info':
        return 'bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 focus:ring-violet-500 shadow-lg hover:shadow-xl transition-all duration-200';
      default:
        return 'bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 focus:ring-violet-500 shadow-lg hover:shadow-xl transition-all duration-200';
    }
  };

  return (
    <div className="mt-6 flex justify-end space-x-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isLoading}
        className={`rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${getConfirmButtonClass()}`}
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Загрузка...
          </div>
        ) : (
          confirmText
        )}
      </button>
    </div>
  );
}

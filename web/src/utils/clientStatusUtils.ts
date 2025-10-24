/**
 * Utility functions for client-friendly status display
 * Hides internal status names from clients and shows user-friendly labels
 */

/**
 * Get client-friendly status display text
 * For "Наличие" and "Проверено" statuses, shows "В работе" instead
 */
export const getClientStatusDisplay = (status: string): string => {
  switch (status) {
    case 'Наличие':
    case 'Проверено':
      return 'В работе';
    default:
      return status;
  }
};

/**
 * Get client-friendly status color classes
 * Uses design system colors with proper contrast and accessibility
 */
export const getClientStatusColor = (status: string): string => {
  switch (status) {
    case 'Новый':
      return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
    case 'Наличие':
    case 'Проверено':
      return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
    case 'Согласование':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
    case 'Купить':
      return 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800';
    case 'Куплен':
      return 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
    case 'Отправить':
    case 'Готов к отправке':
      return 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800';
    case 'Отправлен':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800';
    case 'Выполнен':
      return 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800';
    case 'Отменен':
      return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800';
    default:
      return 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800';
  }
};

/**
 * Check if a status should be hidden from clients
 * Returns true if the status should show as "В работе"
 */
export const isInternalStatus = (status: string): boolean => {
  return status === 'Наличие' || status === 'Проверено';
};

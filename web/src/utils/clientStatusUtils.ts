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
 * For "В работе" status, uses consistent styling
 */
export const getClientStatusColor = (status: string): string => {
  switch (status) {
    case 'Новый':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'Наличие':
    case 'Проверено':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'Согласование':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'Купить':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'Куплен':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'Отправить':
    case 'Готов к отправке':
      return 'bg-teal-100 text-teal-800 border border-teal-200';
    case 'Отправлен':
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    case 'Выполнен':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'Отменен':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

/**
 * Check if a status should be hidden from clients
 * Returns true if the status should show as "В работе"
 */
export const isInternalStatus = (status: string): boolean => {
  return status === 'Наличие' || status === 'Проверено';
};

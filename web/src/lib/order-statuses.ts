/**
 * Centralized order status definitions
 * Based on the required status list excluding резервировать and зарезервирован
 */

export const ORDER_STATUSES = [
  {
    value: 'Новый',
    label: 'Новый',
    color: 'bg-violet-100 text-violet-800 border-violet-200',
    description: 'New order',
  },
  {
    value: 'Наличие',
    label: 'Наличие',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Checking availability',
  },
  {
    value: 'Проверено',
    label: 'Проверено',
    color: 'bg-violet-100 text-violet-800 border-violet-200',
    description: 'Verified/Checked',
  },
  {
    value: 'Согласование',
    label: 'Согласование',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Approval/Coordination',
  },
  {
    value: 'Согласован',
    label: 'Согласован',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Approved/Coordinated',
  },
  {
    value: 'Купить',
    label: 'Купить',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'To Buy',
  },
  {
    value: 'Куплен',
    label: 'Куплен',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Bought/Purchased',
  },
  {
    value: 'Отправить',
    label: 'Отправить',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'To Send/Dispatch',
  },
  {
    value: 'Готов к отправке',
    label: 'Готов к отправке',
    color: 'bg-violet-100 text-violet-800 border-violet-200',
    description: 'Ready for Dispatch',
  },
  {
    value: 'Отправлен',
    label: 'Отправлен',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Sent/Dispatched',
  },
  {
    value: 'Выполнен',
    label: 'Выполнен',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Completed/Fulfilled',
  },
  {
    value: 'Отменен',
    label: 'Отменен',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Canceled',
  },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]['value'];

export const getStatusConfig = (status: string) => {
  return (
    ORDER_STATUSES.find(s => s.value === status) || {
      value: status,
      label: status,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      description: 'Unknown status',
    }
  );
};

export const getStatusLabel = (status: string) => {
  return getStatusConfig(status).label;
};

export const getStatusColor = (status: string) => {
  return getStatusConfig(status).color;
};

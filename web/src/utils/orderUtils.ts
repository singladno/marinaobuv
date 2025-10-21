import { getStatusLabel } from '@/lib/order-statuses';

export const getStatusBadgeVariant = (status: string) => {
  // Map statuses to shadcn/ui badge variants
  switch (status) {
    case 'Новый':
      return 'default';
    case 'Наличие':
    case 'Проверено':
      return 'secondary';
    case 'Согласование':
    case 'Согласован':
      return 'outline';
    case 'Купить':
    case 'Куплен':
      return 'default';
    case 'Отправить':
    case 'Готов к отправке':
    case 'Отправлен':
      return 'outline';
    case 'Выполнен':
      return 'default';
    case 'Отменен':
      return 'destructive';
    default:
      return 'default';
  }
};

export const getStatusText = (status: string) => {
  return getStatusLabel(status);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
};

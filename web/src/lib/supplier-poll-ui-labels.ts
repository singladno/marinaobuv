import type { SupplierPollItemStatus } from '@/lib/supplier-poll-types';

export function supplierPollStatusLabel(
  s: SupplierPollItemStatus,
  isPollActive: boolean
): { short: string; title: string } | null {
  if (!isPollActive || s === 'idle') {
    return null;
  }
  switch (s) {
    case 'no_provider':
      return {
        short: 'Нет WA',
        title: 'У поставщика не указан телефон — в опрос не попало',
      };
    case 'not_in_active_poll':
      return {
        short: 'Вне опроса',
        title:
          'Позиция не в текущем раунде опроса (например добавлена позже). Новый опрос — после завершения текущего',
      };
    case 'sending':
      return {
        short: 'Отправка…',
        title:
          'Сообщения в WhatsApp отправляются в фоне. Можно уйти со страницы — процесс не прервётся',
      };
    case 'awaiting_response':
      return {
        short: 'Ожидает',
        title: 'Ожидаем ответ поставщика по наличию (или уточнение ИИ)',
      };
    case 'awaiting_replacement':
      return {
        short: 'Ждём аналог',
        title:
          'Наличие уточнено (нет в наличии); ждём ответ поставщика по аналогам / замене',
      };
    case 'stock_resolved':
      return {
        short: 'Наличие учтено',
        title: 'По позиции зафиксировано наличие (в наличии / нет)',
      };
    default:
      return null;
  }
}

export function pollModeShortLabel(mode: string | undefined): string {
  if (mode === 'STOCK_AND_INVOICE') return 'Наличие и счёт';
  if (mode === 'STOCK_ONLY') return 'Только наличие';
  return mode ?? '—';
}

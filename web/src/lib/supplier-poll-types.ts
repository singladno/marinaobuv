export type SupplierPollItemStatus =
  | 'idle'
  | 'no_provider'
  | 'sending'
  | 'not_in_active_poll'
  | 'awaiting_response'
  | 'awaiting_replacement'
  | 'stock_resolved';

export type SupplierPollSnapshot =
  | {
      isActive: false;
      itemStatuses: Record<string, SupplierPollItemStatus>;
      /** Показать зелёный баннер: опрос по раунду завершён, наличие по позициям уточнено */
      completionNotice?: {
        message: string;
      };
    }
  | {
      isActive: true;
      runId: string;
      mode: string;
      createdAt: string;
      /** True while run status is SENDING (WhatsApp outbound in progress) */
      outboundSending?: boolean;
      polledCount: number;
      resolvedCount: number;
      awaitingCount: number;
      /** Позиции с уточнённым наличием, но ещё ждём ответ поставщика по замене (ASK_REPLACEMENT) */
      replacementAwaitingCount: number;
      itemStatuses: Record<string, SupplierPollItemStatus>;
    };

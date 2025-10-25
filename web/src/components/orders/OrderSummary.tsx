interface OrderSummaryProps {
  order: {
    total: number;
    subtotal?: number;
    items: Array<{
      qty: number;
      priceBox: number;
      feedbacks?: Array<{
        feedbackType: 'WRONG_SIZE' | 'WRONG_ITEM' | 'AGREE_REPLACEMENT';
      }>;
    }>;
  };
}

export function OrderSummary({ order }: OrderSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(price);
  };

  // Calculate totals for non-refused items
  const { totalItems, refusedItems, refusedValue, currentTotal } =
    order.items.reduce(
      (acc, item) => {
        const isRefused = item.feedbacks?.some(
          feedback =>
            feedback.feedbackType === 'WRONG_SIZE' ||
            feedback.feedbackType === 'WRONG_ITEM'
        );

        const itemValue = item.priceBox * item.qty;

        if (isRefused) {
          acc.refusedItems += item.qty;
          acc.refusedValue += itemValue;
        } else {
          acc.totalItems += item.qty;
          acc.currentTotal += itemValue;
        }

        return acc;
      },
      { totalItems: 0, refusedItems: 0, refusedValue: 0, currentTotal: 0 }
    );

  const hasRefusedItems = refusedItems > 0;

  return (
    <div className="space-y-3 border-t border-gray-200 pt-3">
      {/* Current total */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {totalItems} товар(ов) на сумму
        </div>
        <div className="text-lg font-semibold text-gray-900">
          {formatPrice(currentTotal)}
        </div>
      </div>

      {/* Refused items info */}
      {hasRefusedItems && (
        <div className="rounded-lg bg-red-50 p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-red-700">
              <span>Отказано от {refusedItems} товар(ов)</span>
            </div>
            <div className="text-red-600 line-through">
              -{formatPrice(refusedValue)}
            </div>
          </div>
          <div className="mt-1 text-xs text-red-600">
            Итоговая сумма пересчитана с учетом отказов
          </div>
        </div>
      )}
    </div>
  );
}

interface OrderSummaryProps {
  order: {
    total: number;
    items: Array<{
      qty: number;
      priceBox: number;
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

  const totalItems = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-3">
      <div className="text-sm text-gray-600">
        {totalItems} товар(ов) на сумму
      </div>
      <div className="text-lg font-semibold text-gray-900">
        {formatPrice(order.total)}
      </div>
    </div>
  );
}

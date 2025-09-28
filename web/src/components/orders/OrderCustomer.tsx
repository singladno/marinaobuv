interface OrderCustomerProps {
  order: {
    fullName: string | null;
    phone: string;
    address: string | null;
  };
}

export function OrderCustomer({ order }: OrderCustomerProps) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-gray-900">
        {order.fullName || 'Без имени'}
      </div>
      <div className="text-sm text-gray-600">{order.phone}</div>
      {order.address && (
        <div className="text-sm text-gray-500">{order.address}</div>
      )}
    </div>
  );
}

import type { AdminOrder } from '@/hooks/useOrders';

interface OrderGruzchikInfoProps {
  order: AdminOrder;
  gruzchikById: Map<string, string>;
}

export function OrderGruzchikInfo({
  order,
  gruzchikById,
}: OrderGruzchikInfoProps) {
  const gruzchikName = order.gruzchikId
    ? gruzchikById.get(order.gruzchikId)
    : null;

  return (
    <div className="flex items-center space-x-2">
      {gruzchikName ? (
        <>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
            <span className="text-xs font-medium text-blue-600">
              {gruzchikName.charAt(0)}
            </span>
          </div>
          <span className="text-sm text-gray-900">{gruzchikName}</span>
        </>
      ) : (
        <span className="text-sm text-gray-500">Не назначен</span>
      )}
    </div>
  );
}

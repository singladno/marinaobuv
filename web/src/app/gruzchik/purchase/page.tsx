import { Suspense } from 'react';

import { GruzchikPurchaseTable } from '@/components/features/GruzchikPurchaseTable';

export default function GruzchikPurchasePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Закупка
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Заказы для закупки товаров
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Загрузка...</div>}>
        <GruzchikPurchaseTable />
      </Suspense>
    </div>
  );
}

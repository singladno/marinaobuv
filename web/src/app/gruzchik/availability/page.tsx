import { Suspense } from 'react';

import { GruzchikAvailabilityTable } from '@/components/features/GruzchikAvailabilityTable';

export default function GruzchikAvailabilityPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Наличие
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Управление наличием товаров
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Загрузка...</div>}>
        <GruzchikAvailabilityTable />
      </Suspense>
    </div>
  );
}

import { Suspense } from 'react';

import { MobileGruzchikVerification } from '@/components/features/gruzchik/MobileGruzchikVerification';

export default function GruzchikVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-500">Загрузка...</p>
          </div>
        </div>
      }
    >
      <MobileGruzchikVerification />
    </Suspense>
  );
}

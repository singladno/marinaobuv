import Image from 'next/image';

import { GruzchikRowWrapper } from './GruzchikRowWrapper';

interface GruzchikImageColumnProps {
  orderId: string;
  imageUrl?: string | null;
  name?: string | null;
  updatingOrders: Set<string>;
}

export function GruzchikImageColumn({
  orderId,
  imageUrl,
  name,
  updatingOrders,
}: GruzchikImageColumnProps) {
  return (
    <GruzchikRowWrapper itemId={orderId} updatingItems={updatingOrders}>
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name || 'Товар'}
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
            <span className="text-xs">Нет фото</span>
          </div>
        )}
      </div>
    </GruzchikRowWrapper>
  );
}

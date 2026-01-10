'use client';

import Image from 'next/image';

import { Badge } from '@/components/ui/Badge';

interface ProductSourceButtonProps {
  userRole?: string;
  productId?: string;
  sourceMessageIds?: string[] | null;
  source?: 'WA' | 'AG' | 'MANUAL';
  onSourceClick: () => void;
}

export function ProductSourceButton({
  userRole,
  productId,
  sourceMessageIds,
  source,
  onSourceClick,
}: ProductSourceButtonProps) {
  if (
    userRole !== 'ADMIN' ||
    !productId ||
    ((!sourceMessageIds || sourceMessageIds.length === 0) && source !== 'AG')
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onSourceClick}
      className="absolute left-2 top-2 z-20 transition-all duration-200 focus:outline-none"
      title="Просмотр источника сообщений"
    >
      {source === 'WA' || source === 'AG' ? (
        <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:scale-110 hover:opacity-90 focus:outline-none">
          <Image
            src="/images/whatsapp-icon.png"
            alt="WhatsApp"
            width={48}
            height={48}
            className="h-full w-full rounded"
            unoptimized
          />
        </div>
      ) : (
        <Badge
          variant="secondary"
          className="cursor-pointer border-0 bg-purple-500/80 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-purple-600/80"
        >
          Источник
        </Badge>
      )}
    </button>
  );
}

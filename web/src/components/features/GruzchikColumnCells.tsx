import Image from 'next/image';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

import { GruzchikRowWrapper } from './GruzchikRowWrapper';

interface ImageCellProps {
  imageUrl?: string;
  name: string;
  itemId: string;
  updatingItems: Set<string>;
}

export function ImageCell({
  imageUrl,
  name,
  itemId,
  updatingItems,
}: ImageCellProps) {
  return (
    <GruzchikRowWrapper itemId={itemId} updatingItems={updatingItems}>
      <div className="flex items-center justify-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            width={48}
            height={48}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
            <span className="text-xs text-gray-500">Нет фото</span>
          </div>
        )}
      </div>
    </GruzchikRowWrapper>
  );
}

interface NameCellProps {
  name: string;
  article?: string;
  itemId: string;
  updatingItems: Set<string>;
}

export function NameCell({
  name,
  article,
  itemId,
  updatingItems,
}: NameCellProps) {
  return (
    <GruzchikRowWrapper itemId={itemId} updatingItems={updatingItems}>
      <div className="space-y-1">
        <div className="font-medium text-gray-900 dark:text-white">{name}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Артикул: {article || 'Не указан'}
        </div>
      </div>
    </GruzchikRowWrapper>
  );
}

interface TextCellProps {
  value: string;
  itemId: string;
  updatingItems: Set<string>;
}

export function TextCell({ value, itemId, updatingItems }: TextCellProps) {
  return (
    <GruzchikRowWrapper itemId={itemId} updatingItems={updatingItems}>
      <div className="text-sm text-gray-900 dark:text-white">{value}</div>
    </GruzchikRowWrapper>
  );
}

interface QuantityCellProps {
  quantity: number;
  itemId: string;
  updatingItems: Set<string>;
}

export function QuantityCell({
  quantity,
  itemId,
  updatingItems,
}: QuantityCellProps) {
  return (
    <GruzchikRowWrapper itemId={itemId} updatingItems={updatingItems}>
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {quantity || 0}
      </div>
    </GruzchikRowWrapper>
  );
}

interface PriceCellProps {
  price?: number;
  itemId: string;
  updatingItems: Set<string>;
}

export function PriceCell({ price, itemId, updatingItems }: PriceCellProps) {
  return (
    <GruzchikRowWrapper itemId={itemId} updatingItems={updatingItems}>
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {price ? `${price} ₽` : 'Не указана'}
      </div>
    </GruzchikRowWrapper>
  );
}

interface StatusCellProps {
  status?: string;
  itemId: string;
  updatingItems: Set<string>;
}

export function StatusCell({ status, itemId, updatingItems }: StatusCellProps) {
  const getBadgeProps = () => {
    if (status === 'Закуплен') {
      return {
        variant: 'outline' as const,
        className:
          '!border-green-400 !bg-green-400 !text-white hover:!bg-green-500',
      };
    }
    if (status === 'Наличие') {
      return {
        variant: 'outline' as const,
        className:
          '!border-blue-400 !bg-blue-400 !text-white hover:!bg-blue-500',
      };
    }
    return {
      variant: 'outline' as const,
      className: 'border-gray-300 bg-gray-50 text-gray-600',
    };
  };

  const badgeProps = getBadgeProps();

  return (
    <GruzchikRowWrapper itemId={itemId} updatingItems={updatingItems}>
      <Badge variant={badgeProps.variant} className={badgeProps.className}>
        {status || 'Не указан'}
      </Badge>
    </GruzchikRowWrapper>
  );
}

interface ActionsCellProps {
  itemId: string;
  updatingItems: Set<string>;
  onUpdate?: (itemId: string) => void;
  onView?: (itemId: string) => void;
}

export function ActionsCell({
  itemId,
  updatingItems,
  onUpdate,
  onView,
}: ActionsCellProps) {
  return (
    <GruzchikRowWrapper itemId={itemId} updatingItems={updatingItems}>
      <div className="flex flex-col space-y-1">
        <Button
          size="sm"
          variant="primary"
          className="w-full text-xs"
          onClick={() => onUpdate?.(itemId)}
        >
          Обновить
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={() => onView?.(itemId)}
        >
          Подробнее
        </Button>
      </div>
    </GruzchikRowWrapper>
  );
}

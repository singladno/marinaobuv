'use client';

import { memo, useMemo } from 'react';
import { Trash2 } from 'lucide-react';

import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  PurchaseItemImageSlider,
  getPurchaseItemGalleryImages,
} from '@/components/features/PurchaseItemImageSlider';
import type { PurchaseItem } from '@/contexts/PurchaseItemSortingContext';

export type EditingField = {
  itemId: string;
  field: 'name' | 'description' | 'price' | 'sortIndex';
} | null;

type Props = {
  item: PurchaseItem;
  isDragging: boolean;
  editingField: EditingField;
  editValue: string;
  deletingItemId: string | null;
  setEditValue: (v: string) => void;
  saveFieldEdit: () => void;
  cancelFieldEdit: () => void;
  startFieldEdit: (
    itemId: string,
    field: 'name' | 'description' | 'price' | 'sortIndex',
    current: string | number
  ) => void;
  onDelete: (itemId: string, itemName: string) => void;
};

function AdminPurchaseItemCardInner({
  item,
  isDragging,
  editingField,
  editValue,
  deletingItemId,
  setEditValue,
  saveFieldEdit,
  cancelFieldEdit,
  startFieldEdit,
  onDelete,
}: Props) {
  const galleryImages = useMemo(
    () => getPurchaseItemGalleryImages(item),
    [item]
  );

  return (
    <Card
      className={`relative flex h-full flex-col overflow-hidden p-3 transition-opacity duration-200 [contain-intrinsic-size:420px_560px] [content-visibility:auto] ${
        isDragging ? 'opacity-20' : ''
      }`}
    >
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onDelete(item.id, item.name);
        }}
        disabled={deletingItemId === item.id}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        title="Удалить товар из закупки"
      >
        {deletingItemId === item.id ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>

      <div className="mb-3 flex pr-9">
        {editingField?.itemId === item.id &&
        editingField?.field === 'sortIndex' ? (
          <Input
            type="number"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveFieldEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') saveFieldEdit();
              if (e.key === 'Escape') cancelFieldEdit();
            }}
            className="box-border h-8 w-16 min-w-16 max-w-16 px-1 py-1 text-center text-sm tabular-nums"
            placeholder="#"
            autoFocus
          />
        ) : (
          <div
            className="flex h-8 w-16 min-w-16 max-w-16 cursor-pointer items-center justify-center rounded border border-gray-200 bg-gray-100 px-1 py-1 text-sm font-medium tabular-nums hover:border-gray-300 hover:bg-gray-200"
            onClick={() => startFieldEdit(item.id, 'sortIndex', item.sortIndex)}
          >
            {item.sortIndex}
          </div>
        )}
      </div>

      <div className="shrink-0">
        <PurchaseItemImageSlider images={galleryImages} alt={item.name} />
      </div>

      <div className="mt-3 flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {editingField?.itemId === item.id &&
          editingField?.field === 'price' ? (
            <Input
              type="number"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={saveFieldEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') saveFieldEdit();
                if (e.key === 'Escape') cancelFieldEdit();
              }}
              className="w-24"
              placeholder="Цена"
              autoFocus
            />
          ) : (
            <Text
              className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-base font-semibold tabular-nums hover:border-gray-300 hover:bg-gray-100 sm:text-lg"
              onClick={() => startFieldEdit(item.id, 'price', item.price)}
            >
              {new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
              }).format(Number(item.price))}
            </Text>
          )}
          <Text className="text-sm font-semibold tabular-nums text-red-600 line-through">
            {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
            }).format(Number(item.oldPrice))}
          </Text>
        </div>

        <div className="w-full min-w-0">
          {editingField?.itemId === item.id &&
          editingField?.field === 'name' ? (
            <Input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={saveFieldEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') saveFieldEdit();
                if (e.key === 'Escape') cancelFieldEdit();
              }}
              className="w-full px-2 py-1"
              placeholder="Название товара"
              autoFocus
            />
          ) : (
            <Text
              className="block w-full cursor-pointer rounded border border-gray-200 px-2 py-1 text-sm font-semibold leading-snug hover:border-gray-300 hover:bg-gray-100"
              onClick={() => startFieldEdit(item.id, 'name', item.name)}
            >
              {item.name}
            </Text>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {editingField?.itemId === item.id &&
          editingField?.field === 'description' ? (
            <textarea
              value={editValue}
              onChange={e => {
                setEditValue(e.target.value);
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }}
              onFocus={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }}
              onBlur={saveFieldEdit}
              onKeyDown={e => {
                if (e.key === 'Escape') cancelFieldEdit();
              }}
              className="min-h-[2.5rem] w-full rounded-md border border-gray-200 p-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              rows={1}
              style={{ overflow: 'hidden', resize: 'none' }}
              placeholder="Описание товара"
              aria-label="Описание товара"
              autoFocus
            />
          ) : (
            <div
              className="text-muted-foreground min-h-[2.5rem] cursor-pointer rounded border border-gray-200 px-2 py-2 text-sm hover:border-gray-300 hover:bg-gray-100"
              onClick={() =>
                startFieldEdit(item.id, 'description', item.description)
              }
            >
              <div className="line-clamp-3 text-sm">{item.description}</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Custom memo must compare *fields* (e.g. sortIndex). The old compare used
 * `prev.item !== next.item` first and then returned true — when React reused the
 * same reference, sortIndex updates were skipped and badges looked stale.
 */
function arePropsEqual(prev: Props, next: Props): boolean {
  if (prev.isDragging !== next.isDragging) return false;
  if (prev.deletingItemId !== next.deletingItemId) return false;

  const id = next.item.id;
  const editingThis =
    next.editingField?.itemId === id || prev.editingField?.itemId === id;
  if (editingThis) {
    if (prev.editingField !== next.editingField) return false;
    if (prev.editValue !== next.editValue) return false;
  }

  if (prev.item.id !== next.item.id) return false;
  if ((prev.item.color ?? null) !== (next.item.color ?? null)) return false;
  if (prev.item.sortIndex !== next.item.sortIndex) return false;
  if (prev.item.name !== next.item.name) return false;
  if (prev.item.description !== next.item.description) return false;
  if (Number(prev.item.price) !== Number(next.item.price)) return false;
  if (Number(prev.item.oldPrice) !== Number(next.item.oldPrice)) return false;

  const pImgs = prev.item.product?.images ?? [];
  const nImgs = next.item.product?.images ?? [];
  if (pImgs.length !== nImgs.length) return false;
  for (let i = 0; i < pImgs.length; i++) {
    if (pImgs[i]?.id !== nImgs[i]?.id) return false;
  }

  return true;
}

export const AdminPurchaseItemCard = memo(
  AdminPurchaseItemCardInner,
  arePropsEqual
);

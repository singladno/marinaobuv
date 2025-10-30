import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import {
  calculateAmountOfSizes,
  calculatePricePerBox,
  calculateItemTotal,
} from '@/utils/pricing-calculations';

interface CartItemProps {
  item: {
    slug: string;
    qty: number;
    color?: string | null;
    product: {
      id: string;
      name: string;
      pricePair: number;
      images: Array<{ url: string; alt?: string }>;
      category: { name: string };
      article?: string;
      sizes: Array<{ size: string; count: number }>;
    };
  };
  onRemove: (slug: string, color?: string | null) => void;
  onUpdateQuantity: (
    slug: string,
    quantity: number,
    color?: string | null
  ) => void;
  onToggleFavorite?: (slug: string) => void;
  isFavorite?: boolean;
  isUpdating?: boolean;
  isRemoving?: boolean;
}

export function CartItem({
  item,
  onRemove,
  onUpdateQuantity,
  onToggleFavorite,
  isFavorite = false,
  isUpdating = false,
  isRemoving = false,
}: CartItemProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Calculate pricing using utility functions
  const amountOfSizes = calculateAmountOfSizes(item.product.sizes);
  const pricePerBox = calculatePricePerBox(
    item.product.pricePair,
    item.product.sizes
  );
  // Total should be price per box * quantity (not price per pair * quantity)
  const totalPrice = pricePerBox * item.qty;

  // Pick image for selected color if available
  const displayImageUrl = useMemo(() => {
    const preferredColor = (item.color || '').toLowerCase();
    if (preferredColor) {
      const matched = item.product.images.find(
        img => (img.alt || '').toLowerCase() === preferredColor
      );
      if (matched?.url) return matched.url;
    }
    return item.product.images[0]?.url || '/placeholder.svg';
  }, [item.color, item.product.images]);

  const displayAlt = useMemo(() => {
    return item.color
      ? `${item.product.name} — ${item.color}`
      : item.product.name;
  }, [item.product.name, item.color]);

  const displayColor = useMemo(() => {
    const explicit = (item.color || '').trim();
    if (explicit) return explicit;
    const inferred = (item.product.images[0]?.alt || '').trim();
    return inferred || 'не указан';
  }, [item.color, item.product.images]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Desktop Layout */}
      <div className="hidden md:flex md:items-center md:gap-4">
        {/* Product Image with Action Icons */}
        <div className="relative flex-shrink-0">
          <Link
            href={{
              pathname: `/product/${item.slug}`,
              query: item.color ? { color: item.color } : {},
            }}
            className="block"
          >
            <Image
              src={displayImageUrl}
              alt={displayAlt}
              width={120}
              height={120}
              className="h-24 w-24 rounded-lg object-cover"
            />
          </Link>

          {/* Action Icons - positioned next to image */}
          <div className="absolute -right-2 -top-2 flex gap-1">
            <button
              onClick={() => onToggleFavorite?.(item.slug)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50"
              title={
                isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'
              }
              aria-label={
                isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'
              }
            >
              {isFavorite ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => onRemove(item.slug, item.color ?? null)}
              disabled={isRemoving}
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-red-50 ${
                isRemoving ? 'cursor-not-allowed opacity-50' : ''
              } ${!isRemoving ? 'cursor-pointer' : ''}`}
              title="Удалить из корзины"
              aria-label="Удалить из корзины"
            >
              {isRemoving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              ) : (
                <TrashIcon className="h-4 w-4 text-red-600" />
              )}
            </button>
          </div>
        </div>

        {/* Product Information */}
        <div className="min-w-0 flex-1">
          <Link
            href={{
              pathname: `/product/${item.slug}`,
              query: item.color ? { color: item.color } : {},
            }}
            className="block"
          >
            <h3 className="text-lg font-semibold text-gray-900 transition-colors hover:text-purple-600">
              {item.product.name}
            </h3>
          </Link>

          <p className="mt-1 text-sm text-gray-600">Цвет: {displayColor}</p>

          {item.product.article && (
            <p className="mt-1 text-sm text-gray-500">
              Артикул: {item.product.article}
            </p>
          )}

          <p className="mt-1 text-sm text-gray-500">
            Категория: {item.product.category.name}
          </p>

          {/* Category tag */}
          <div className="mt-2">
            <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              {item.product.category.name}
            </span>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdateQuantity(
                  item.slug,
                  Math.max(1, item.qty - 1),
                  item.color ?? null
                )
              }
              disabled={isUpdating}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 ${
                isUpdating ? 'cursor-not-allowed opacity-50' : ''
              } ${!isUpdating ? 'cursor-pointer' : ''}`}
              title="Уменьшить количество"
              aria-label="Уменьшить количество"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium text-gray-900">
              {isUpdating ? '...' : item.qty}
            </span>
            <button
              onClick={() =>
                onUpdateQuantity(item.slug, item.qty + 1, item.color ?? null)
              }
              disabled={isUpdating}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 ${
                isUpdating ? 'cursor-not-allowed opacity-50' : ''
              } ${!isUpdating ? 'cursor-pointer' : ''}`}
              title="Увеличить количество"
              aria-label="Увеличить количество"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Price Display - Red with wallet icon */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
            </svg>
            <span className="text-xl font-bold text-red-600">
              {formatPrice(totalPrice)}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Количество пар: {amountOfSizes}
          </div>
          <div className="text-xs text-gray-400">
            {formatPrice(item.product.pricePair)} за пару
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Top Row: Image + Product Info + Action Icons */}
        <div className="flex items-start gap-3">
          {/* Product Image */}
          <div className="relative flex-shrink-0">
            <Link
              href={{
                pathname: `/product/${item.slug}`,
                query: item.color ? { color: item.color } : {},
              }}
              className="block"
            >
              <Image
                src={displayImageUrl}
                alt={displayAlt}
                width={80}
                height={80}
                className="h-20 w-20 rounded-lg object-cover"
              />
            </Link>
          </div>

          {/* Product Information */}
          <div className="min-w-0 flex-1">
            <Link
              href={{
                pathname: `/product/${item.slug}`,
                query: item.color ? { color: item.color } : {},
              }}
              className="block"
            >
              <h3 className="text-base font-semibold text-gray-900 transition-colors hover:text-purple-600">
                {item.product.name}
              </h3>
            </Link>

            <p className="mt-1 text-xs text-gray-600">Цвет: {displayColor}</p>

            {item.product.article && (
              <p className="mt-1 text-xs text-gray-500">
                Артикул: {item.product.article}
              </p>
            )}

            <p className="mt-1 text-xs text-gray-500">
              Категория: {item.product.category.name}
            </p>
          </div>

          {/* Action Icons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onToggleFavorite?.(item.slug)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50"
              title={
                isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'
              }
              aria-label={
                isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'
              }
            >
              {isFavorite ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => onRemove(item.slug, item.color ?? null)}
              disabled={isRemoving}
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-red-50 ${
                isRemoving ? 'cursor-not-allowed opacity-50' : ''
              } ${!isRemoving ? 'cursor-pointer' : ''}`}
              title="Удалить из корзины"
              aria-label="Удалить из корзины"
            >
              {isRemoving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
              ) : (
                <TrashIcon className="h-4 w-4 text-red-600" />
              )}
            </button>
          </div>
        </div>

        {/* Third Row: Quantity Controls + Price */}
        <div className="mt-4 flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdateQuantity(
                  item.slug,
                  Math.max(1, item.qty - 1),
                  item.color ?? null
                )
              }
              disabled={isUpdating}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 ${
                isUpdating ? 'cursor-not-allowed opacity-50' : ''
              } ${!isUpdating ? 'cursor-pointer' : ''}`}
              title="Уменьшить количество"
              aria-label="Уменьшить количество"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-medium text-gray-900">
              {isUpdating ? '...' : item.qty}
            </span>
            <button
              onClick={() =>
                onUpdateQuantity(item.slug, item.qty + 1, item.color ?? null)
              }
              disabled={isUpdating}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 ${
                isUpdating ? 'cursor-not-allowed opacity-50' : ''
              } ${!isUpdating ? 'cursor-pointer' : ''}`}
              title="Увеличить количество"
              aria-label="Увеличить количество"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Price Display */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
              </svg>
              <span className="text-lg font-bold text-red-600">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Количество пар: {amountOfSizes}
            </div>
            <div className="text-xs text-gray-400">
              {formatPrice(item.product.pricePair)} за пару
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

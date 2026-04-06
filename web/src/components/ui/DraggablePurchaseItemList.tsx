'use client';

import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  memo,
} from 'react';
import Image from 'next/image';
import {
  DndContext,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  rectIntersection,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  defaultAnimateLayoutChanges,
  arrayMove,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import {
  usePurchaseItemSorting,
  PurchaseItem,
} from '@/contexts/PurchaseItemSortingContext';
import { getPurchaseItemGalleryImages } from '@/components/features/PurchaseItemImageSlider';

interface DraggablePurchaseItemListProps {
  items: PurchaseItem[];
  purchaseId: string;
  onItemsReordered: (reorderedItems: PurchaseItem[]) => void;
  children: (item: PurchaseItem, isDragging: boolean) => React.ReactNode;
}

interface SortableItemWrapperProps {
  item: PurchaseItem;
  children: (isDragging: boolean) => React.ReactNode;
}

/** Memoized so DragOverlay does not rebuild heavy markup on every pointer move. */
const PurchaseDragOverlayPreview = memo(function PurchaseDragOverlayPreview({
  item: activeItem,
}: {
  item: PurchaseItem;
}) {
  const gallery = useMemo(
    () => getPurchaseItemGalleryImages(activeItem),
    [activeItem]
  );
  const src = gallery[0]?.url;
  return (
    <div className="w-[min(100vw-2rem,22rem)] scale-105 transform overflow-hidden rounded-lg border-2 border-blue-400 bg-white opacity-95 shadow-2xl">
      <div className="flex flex-col p-3">
        <div className="mb-3">
          <div className="flex h-8 w-16 items-center justify-center rounded border border-gray-200 bg-gray-100 text-sm font-medium tabular-nums">
            {activeItem.sortIndex}
          </div>
        </div>
        <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-lg">
          {src ? (
            <Image
              src={src}
              alt={activeItem.name}
              width={352}
              height={352}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <span className="text-sm text-gray-500">Нет фото</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tabular-nums">
              {new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
              }).format(Number(activeItem.price))}
            </span>
            <span className="text-sm font-semibold tabular-nums text-red-600 line-through">
              {new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
              }).format(Number(activeItem.oldPrice))}
            </span>
          </div>
          <span className="block text-sm font-semibold leading-snug">
            {activeItem.name}
          </span>
          <div className="line-clamp-3 text-sm text-gray-600">
            {activeItem.description}
          </div>
        </div>
      </div>
    </div>
  );
});

function SortableItemWrapper({
  item,
  children,
  isAnyDragging,
}: SortableItemWrapperProps & { isAnyDragging: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    // `() => true` forces layout animations on every sortable every frame — very janky.
    animateLayoutChanges: args => defaultAnimateLayoutChanges(args),
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // When any item is dragging, disable touch-action on all items to prevent interference
    // This fixes the issue where vertical drags get blocked
    // When not dragging, allow vertical scrolling
    touchAction: isAnyDragging ? 'none' : 'pan-y',
    // When dragging, hide the original item from collision detection and pointer events
    // This prevents it from detecting itself when dragging vertically
    pointerEvents: isDragging ? 'none' : 'auto',
    // When dragging, hide the original item completely (DragOverlay will show it)
    // This prevents collision detection from finding the original item
    visibility: isDragging ? 'hidden' : 'visible',
    // Raise z-index when dragging to ensure it's above neighbors
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      data-item-id={item.id}
      style={style}
      className={cn(
        'cursor-grab select-none active:cursor-grabbing',
        isDragging && 'opacity-30' // DragOverlay shows the preview; avoid transition-* (extra paint during drag)
      )}
      {...listeners}
      {...attributes}
    >
      {children(isDragging)}
    </div>
  );
}

export function DraggablePurchaseItemList({
  items,
  purchaseId,
  onItemsReordered,
  children,
}: DraggablePurchaseItemListProps) {
  const { getSortedItems, loadSortingForPurchase, setOrderForPurchase } =
    usePurchaseItemSorting();
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());

  // When dragging, disable touch-action on all items to prevent interference
  const isDragging = activeId !== null;

  useEffect(() => {
    loadSortingForPurchase(purchaseId);
  }, [purchaseId, loadSortingForPurchase]);

  // Sensors with activation constraints
  // Both use delay-based activation: hold for 300ms to start dragging
  // This allows normal scrolling while enabling drag on intentional hold
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 300, // Hold for 300ms to activate drag
        tolerance: 10, // Allow more movement during hold to prevent accidental cancellation
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300, // Hold for 300ms to activate drag
        tolerance: 10, // Allow more movement during hold to prevent accidental cancellation
      },
    })
    // KeyboardSensor disabled to prevent key press interference with editing
  );

  const sortedItems = useMemo(
    () => getSortedItems(items, purchaseId),
    [getSortedItems, items, purchaseId]
  );

  const sortedIdsKey = useMemo(
    () => sortedItems.map(i => i.id).join(','),
    [sortedItems]
  );

  const sortableItemIds = useMemo(
    () => sortedItems.map(item => item.id),
    [sortedItems]
  );

  // FLIP for programmatic reorders only — skip while dragging (getBoundingClientRect × N is costly).
  useLayoutEffect(() => {
    if (activeId) return;
    const container = containerRef.current;
    if (!container) return;
    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>('[data-item-id]')
    );
    const nextRects = new Map<string, DOMRect>();
    nodes.forEach(node => {
      const id = node.getAttribute('data-item-id');
      if (!id) return;
      const rect = node.getBoundingClientRect();
      nextRects.set(id, rect);
      const prev = prevRectsRef.current.get(id);
      if (prev) {
        const dx = prev.left - rect.left;
        const dy = prev.top - rect.top;
        if (dx !== 0 || dy !== 0) {
          node.style.transform = `translate(${dx}px, ${dy}px)`;
          node.style.transition = 'transform 250ms ease';
          requestAnimationFrame(() => {
            node.style.transform = '';
          });
          const handleEnd = () => {
            node.style.transition = '';
            node.removeEventListener('transitionend', handleEnd);
          };
          node.addEventListener('transitionend', handleEnd);
        }
      }
    });
    prevRectsRef.current = nextRects;
  }, [sortedIdsKey, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEndEvent = (event: DragEndEvent) => {
    setActiveId(null);

    if (event.active && event.over && event.active.id !== event.over.id) {
      const sortedItems = getSortedItems(items, purchaseId);
      const sourceIndex = sortedItems.findIndex(
        item => item.id === event.active.id
      );
      const destinationIndex = sortedItems.findIndex(
        item => item.id === event.over!.id
      );

      if (sourceIndex !== -1 && destinationIndex !== -1) {
        const reorderedItems = arrayMove(
          sortedItems,
          sourceIndex,
          destinationIndex
        );
        const itemsWithNewIndexes = reorderedItems.map((item, index) => ({
          ...item,
          sortIndex: index + 1,
        }));
        setOrderForPurchase(
          purchaseId,
          itemsWithNewIndexes.map(i => i.id)
        );
        onItemsReordered(itemsWithNewIndexes);
      }
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.BeforeDragging,
        },
      }}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndEvent}
      onDragCancel={() => {
        // Clear active ID if drag is cancelled
        setActiveId(null);
      }}
    >
      <SortableContext items={sortableItemIds} strategy={rectSortingStrategy}>
        <div
          ref={containerRef}
          className="grid grid-cols-1 items-stretch gap-6 [contain:layout_style] sm:grid-cols-2 md:grid-cols-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {sortedItems.map(item => (
            <SortableItemWrapper
              key={item.id}
              item={item}
              isAnyDragging={isDragging}
            >
              {isDragging => children(item, isDragging)}
            </SortableItemWrapper>
          ))}
        </div>
      </SortableContext>
      <DragOverlay
        style={{
          touchAction: 'none',
          pointerEvents: 'auto',
          zIndex: 9999,
        }}
        dropAnimation={null}
      >
        {activeId
          ? (() => {
              const activeItem = sortedItems.find(i => i.id === activeId);
              return activeItem ? (
                <PurchaseDragOverlayPreview item={activeItem} />
              ) : null;
            })()
          : null}
      </DragOverlay>
    </DndContext>
  );
}

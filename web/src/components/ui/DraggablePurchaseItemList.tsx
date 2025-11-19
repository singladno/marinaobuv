'use client';

import React, {
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  usePurchaseItemSorting,
  PurchaseItem,
} from '@/contexts/PurchaseItemSortingContext';

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
    animateLayoutChanges: () => true,
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
        'cursor-grab select-none transition-opacity active:cursor-grabbing',
        isDragging && 'opacity-30' // Make original item very transparent when dragging (DragOverlay shows it)
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
  const { getSortedItems, handleDragEnd } = usePurchaseItemSorting();
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());

  // When dragging, disable touch-action on all items to prevent interference
  const isDragging = activeId !== null;

  // Load sorting for this purchase when component mounts or purchaseId changes
  useEffect(() => {
    // This will trigger the context to load sorting for this purchase
    getSortedItems(items, purchaseId);
  }, [purchaseId, items, getSortedItems]);

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

  // Force re-render when sortedItemIds changes
  const sortedItems = getSortedItems(items, purchaseId);

  // FLIP animation for programmatic reorders (manual index edits)
  useLayoutEffect(() => {
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
  }, [sortedItems.map(i => i.id).join(',')]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEndEvent = (event: DragEndEvent) => {
    // Clear active ID immediately to allow next drag
    setActiveId(null);

    // Handle the drag end in the context (for localStorage)
    handleDragEnd(event, items, purchaseId);

    // Update the database with new indexes
    if (event.active && event.over && event.active.id !== event.over.id) {
      const sortedItems = getSortedItems(items, purchaseId);
      const sourceIndex = sortedItems.findIndex(
        item => item.id === event.active.id
      );
      const destinationIndex = sortedItems.findIndex(
        item => item.id === event.over!.id
      );

      if (sourceIndex !== -1 && destinationIndex !== -1) {
        // Create new array with reordered items
        const reorderedItems = [...sortedItems];
        const [movedItem] = reorderedItems.splice(sourceIndex, 1);
        reorderedItems.splice(destinationIndex, 0, movedItem);

        // Update sortIndex for all items based on new order
        const itemsWithNewIndexes = reorderedItems.map((item, index) => ({
          ...item,
          sortIndex: index + 1,
        }));

        // Call the callback to update the database
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndEvent}
      onDragCancel={() => {
        // Clear active ID if drag is cancelled
        setActiveId(null);
      }}
    >
      <SortableContext
        items={sortedItems.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={containerRef}
          className="space-y-4"
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
        {activeId ? (
          <div className="scale-105 transform rounded-lg border-2 border-blue-400 bg-white p-4 opacity-95 shadow-2xl">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="mb-2 flex justify-center gap-2">
                  <div className="flex h-8 w-[42px] items-center justify-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-medium">
                    {sortedItems.find(item => item.id === activeId)?.sortIndex}
                  </div>
                </div>
                <div className="flex justify-center">
                  {(() => {
                    const activeItem = sortedItems.find(i => i.id === activeId);
                    if (!activeItem) return null;
                    const normalize = (s?: string | null) =>
                      (s || '').trim().toLowerCase();
                    const color = normalize(activeItem.color);
                    const imgs = activeItem.product.images || [];
                    const colorMatch = imgs.find(img => normalize(img.color) === color);
                    const src = (colorMatch || imgs[0])?.url;
                    return src ? (
                      <Image
                        src={src}
                        alt={
                          sortedItems.find(item => item.id === activeId)?.name ||
                          ''
                        }
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100">
                        <span className="text-xs text-gray-500">Нет фото</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-4">
                  <span className="truncate text-sm font-semibold">
                    {sortedItems.find(item => item.id === activeId)?.name}
                  </span>
                  <span className="text-lg font-semibold">
                    {sortedItems.find(item => item.id === activeId)?.price &&
                      new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                      }).format(
                        Number(
                          sortedItems.find(item => item.id === activeId)?.price
                        )
                      )}
                  </span>
                </div>
                <div className="line-clamp-2 text-sm text-gray-600">
                  {sortedItems.find(item => item.id === activeId)?.description}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

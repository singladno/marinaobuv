'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProviderSorting } from '@/contexts/ProviderSortingContext';

export interface Provider {
  id: string;
  name: string;
}

interface DraggableProviderListProps {
  providers: Provider[];
  selectedProviderId: string | null;
  onProviderSelect: (providerId: string | null) => void;
}

interface SortableProviderItemProps {
  provider: Provider;
  isSelected: boolean;
  onSelect: () => void;
}

function SortableProviderItem({
  provider,
  isSelected,
  onSelect,
}: SortableProviderItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: provider.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
        isSelected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
        title="Перетащите для изменения порядка"
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Provider content */}
      <button
        onClick={onSelect}
        className="flex flex-1 items-center justify-between text-left"
      >
        <span className="text-sm">{provider.name}</span>
        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
      </button>
    </div>
  );
}

export function DraggableProviderList({
  providers,
  selectedProviderId,
  onProviderSelect,
}: DraggableProviderListProps) {
  const { getSortedProviders, handleDragEnd, sortedProviderIds } =
    useProviderSorting();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Force re-render when sortedProviderIds changes
  const sortedProviders = getSortedProviders(providers);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEndEvent = (event: DragEndEvent) => {
    setActiveId(null);
    handleDragEnd(event, providers);
  };

  if (providers.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        Нет поставщиков в заказах
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* "Все поставщики" option - always at the top and not draggable */}
      <button
        onClick={() => onProviderSelect(null)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors',
          selectedProviderId === null
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <span className="text-sm">Все поставщики</span>
        {selectedProviderId === null && (
          <Check className="h-4 w-4 text-blue-600" />
        )}
      </button>

      {/* Draggable providers list */}
      <div className="relative">
        <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
          <GripVertical className="h-3 w-3" />
          <span>Перетащите для изменения порядка</span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEndEvent}
        >
          <SortableContext
            items={sortedProviders.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedProviders.map(provider => (
                <SortableProviderItem
                  key={provider.id}
                  provider={provider}
                  isSelected={selectedProviderId === provider.id}
                  onSelect={() => onProviderSelect(provider.id)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="flex items-center gap-3 rounded-lg border border-blue-500 bg-blue-50 px-3 py-2 shadow-lg">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-blue-700">
                  {sortedProviders.find(p => p.id === activeId)?.name}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

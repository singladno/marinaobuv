'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
  selectedProviderIds?: string[]; // For multi-select mode
  onProviderSelect: (providerId: string | null) => void;
  onProviderToggle?: (providerId: string) => void; // For multi-select mode
  onClearAll?: () => void; // For clearing all selections in multi-select mode
  multiSelect?: boolean; // Enable multi-select mode
  emptyMessage?: string;
}

interface SortableProviderItemProps {
  provider: Provider;
  isSelected: boolean;
  onSelect: () => void;
  multiSelect?: boolean;
}

function SortableProviderItem({
  provider,
  isSelected,
  onSelect,
  multiSelect = false,
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

  const handleButtonClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent drag when clicking the button
    e.stopPropagation();
    onSelect();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors cursor-grab touch-none select-none active:cursor-grabbing',
        isSelected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        isDragging && 'opacity-50 shadow-lg'
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <button
        onClick={handleButtonClick}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex flex-1 items-center justify-between text-left cursor-pointer"
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
  selectedProviderIds = [],
  onProviderSelect,
  onProviderToggle,
  onClearAll,
  multiSelect = false,
  emptyMessage = 'Нет поставщиков в заказах',
}: DraggableProviderListProps) {
  const { getSortedProviders, handleDragEnd, sortedProviderIds } =
    useProviderSorting();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch to distinguish from tap
        tolerance: 8, // 8px tolerance
      },
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
        {emptyMessage}
      </div>
    );
  }

  // In multi-select mode, "Все поставщики" clears all selections
  const handleAllProvidersClick = () => {
    if (multiSelect) {
      if (onClearAll) {
        // Use dedicated clear all callback if available
        onClearAll();
      } else if (onProviderToggle) {
        // Fallback: clear all selections by toggling each selected provider
        selectedProviderIds.forEach(id => {
          onProviderToggle(id);
        });
      }
    } else {
      onProviderSelect(null);
    }
  };

  const isAllSelected = multiSelect
    ? selectedProviderIds.length === 0
    : selectedProviderId === null;

  return (
    <div className="space-y-2">
      {/* "Все поставщики" option - always at the top and not draggable */}
      <button
        onClick={handleAllProvidersClick}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors',
          isAllSelected
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        )}
      >
        <span className="text-sm">Все поставщики</span>
        {isAllSelected && (
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
              {sortedProviders.map(provider => {
                const isSelected = multiSelect
                  ? selectedProviderIds.includes(provider.id)
                  : selectedProviderId === provider.id;

                const handleSelect = () => {
                  if (multiSelect && onProviderToggle) {
                    onProviderToggle(provider.id);
                  } else {
                    onProviderSelect(provider.id);
                  }
                };

                return (
                  <SortableProviderItem
                    key={provider.id}
                    provider={provider}
                    isSelected={isSelected}
                    onSelect={handleSelect}
                    multiSelect={multiSelect}
                  />
                );
              })}
            </div>
          </SortableContext>
          {/* No DragOverlay to ensure original element moves during drag */}
        </DndContext>
      </div>
    </div>
  );
}

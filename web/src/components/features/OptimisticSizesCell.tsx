'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type { DraftSize } from '@/types/admin';

interface OptimisticSizesCellProps {
  sizes: DraftSize[];
  onChange: (sizes: DraftSize[]) => Promise<void>;
  disabled?: boolean;
}

export function OptimisticSizesCell({
  sizes,
  onChange,
  disabled = false,
}: OptimisticSizesCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSizes, setEditSizes] = useState<DraftSize[]>(sizes || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setEditSizes(sizes ? [...sizes] : []);
  }, [disabled, sizes]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    // Only save if sizes actually changed
    const hasChanges =
      JSON.stringify(editSizes) !== JSON.stringify(sizes || []);
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onChange(editSizes);
    } catch (error) {
      console.error('Failed to save sizes:', error);
      // Revert to original sizes on error
      setEditSizes([...(sizes || [])]);
    } finally {
      setIsSaving(false);
    }

    setIsEditing(false);
  }, [isSaving, editSizes, sizes, onChange]);

  const handleCancel = useCallback(() => {
    setEditSizes([...(sizes || [])]);
    setIsEditing(false);
  }, [sizes]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    if (isEditing) {
      handleSave();
    }
  }, [isEditing, handleSave]);

  const addSize = useCallback(() => {
    const newSize: DraftSize = {
      id: `temp-${Date.now()}`,
      size: '',
      quantity: 1,
      isActive: true,
    };
    setEditSizes(prev => [...prev, newSize]);
  }, []);

  const removeSize = useCallback((id: string) => {
    setEditSizes(prev => prev.filter(size => size.id !== id));
  }, []);

  const updateSize = useCallback((id: string, updates: Partial<DraftSize>) => {
    setEditSizes(prev =>
      prev.map(size => (size.id === id ? { ...size, ...updates } : size))
    );
  }, []);

  const toggleSizeActive = useCallback((id: string) => {
    setEditSizes(prev =>
      prev.map(size =>
        size.id === id ? { ...size, isActive: !size.isActive } : size
      )
    );
  }, []);

  const displaySizes = useMemo(() => {
    if (!sizes || !Array.isArray(sizes)) {
      return '';
    }
    return sizes
      .filter(size => size.isActive)
      .map(size => size.size)
      .join(', ');
  }, [sizes]);

  if (!isEditing) {
    return (
      <div
        className={`cursor-pointer rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
        onClick={handleEdit}
        data-editable="true"
        title={
          disabled ? 'Редактирование отключено' : 'Нажмите для редактирования'
        }
      >
        {isSaving ? (
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-xs text-gray-500">Сохранение...</span>
          </div>
        ) : (
          displaySizes || '—'
        )}
      </div>
    );
  }

  return (
    <div
      className="space-y-2 rounded border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800"
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Размеры
        </span>
        <div className="flex space-x-1">
          <button
            onClick={addSize}
            className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
            type="button"
          >
            + Добавить
          </button>
          <button
            onClick={handleSave}
            className="rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600"
            type="button"
            disabled={isSaving}
          >
            ✓
          </button>
          <button
            onClick={handleCancel}
            className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
            type="button"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {editSizes.map((size, index) => (
          <div key={size.id} className="flex items-center space-x-2">
            <input
              type="text"
              value={size.size}
              onChange={e => updateSize(size.id, { size: e.target.value })}
              placeholder="Размер"
              aria-label="Размер"
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              value={size.quantity}
              onChange={e =>
                updateSize(size.id, { quantity: Number(e.target.value) })
              }
              min="1"
              aria-label="Количество"
              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() => toggleSizeActive(size.id)}
              className={`rounded px-2 py-1 text-xs ${
                size.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
              }`}
              type="button"
            >
              {size.isActive ? '✓' : '✕'}
            </button>
            <button
              onClick={() => removeSize(size.id)}
              className="rounded bg-red-100 px-2 py-1 text-xs text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
              type="button"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

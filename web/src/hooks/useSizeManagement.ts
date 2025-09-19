import * as React from 'react';

import type { Draft } from '@/types/admin';

export function useSizeManagement(
  sizes: Draft['sizes'],
  onChange?: (next: Draft['sizes']) => Promise<void> | void
) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [draftSize, setDraftSize] = React.useState<string>('');
  const [draftPairs, setDraftPairs] = React.useState<string>('');
  const [savingIndex, setSavingIndex] = React.useState<number | null>(null);

  const startEdit = React.useCallback(
    (index: number) => {
      if (!sizes || !sizes[index]) return;
      const current = sizes[index];
      setDraftSize(current.size ?? '');
      const pairs =
        typeof current.stock === 'number'
          ? String(current.stock)
          : typeof current.count === 'number'
            ? String(current.count)
            : '0';
      setDraftPairs(pairs);
      setEditingIndex(index);
    },
    [sizes]
  );

  const applyEdit = React.useCallback(
    async (index: number) => {
      if (!onChange) return setEditingIndex(null);
      const next = (sizes ? [...sizes] : []) as NonNullable<Draft['sizes']>;
      const current = next[index];
      if (!current) return setEditingIndex(null);

      const numericPairs = Number.isFinite(Number(draftPairs))
        ? Math.max(0, Math.floor(Number(draftPairs)))
        : 0;

      const useCount =
        current.count !== undefined && current.stock === undefined;
      const updated = {
        size: draftSize.trim(),
        stock: useCount ? undefined : numericPairs,
        count: useCount ? numericPairs : undefined,
      };

      next[index] = updated;
      try {
        setSavingIndex(index);
        await Promise.resolve(onChange(next));
        setEditingIndex(null);
      } finally {
        setSavingIndex(null);
      }
    },
    [onChange, sizes, draftSize, draftPairs]
  );

  const deleteItem = React.useCallback(
    async (index: number) => {
      if (!onChange) return;
      const next = (sizes ? [...sizes] : []) as NonNullable<Draft['sizes']>;
      next.splice(index, 1);
      try {
        setSavingIndex(index);
        await Promise.resolve(onChange(next.length ? next : null));
        if (editingIndex === index) setEditingIndex(null);
      } finally {
        setSavingIndex(null);
      }
    },
    [onChange, sizes, editingIndex]
  );

  const addNew = React.useCallback(async () => {
    if (!onChange) return;
    const next = (sizes ? [...sizes] : []) as NonNullable<Draft['sizes']>;
    const newItem = { size: '', stock: 0 };
    next.push(newItem);
    try {
      setSavingIndex(next.length - 1);
      await Promise.resolve(onChange(next));
      setDraftSize('');
      setDraftPairs('0');
      setEditingIndex(next.length - 1);
    } finally {
      setSavingIndex(null);
    }
  }, [onChange, sizes]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (editingIndex === null) return;
      if (e.key === 'Enter') applyEdit(editingIndex);
      if (e.key === 'Escape') setEditingIndex(null);
    },
    [editingIndex, applyEdit]
  );

  return {
    editingIndex,
    setEditingIndex,
    draftSize,
    setDraftSize,
    draftPairs,
    setDraftPairs,
    savingIndex,
    startEdit,
    applyEdit,
    deleteItem,
    addNew,
    handleKeyDown,
  };
}

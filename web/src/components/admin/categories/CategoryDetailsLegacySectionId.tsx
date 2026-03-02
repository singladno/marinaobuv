'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Loader } from '@/components/ui/Loader';
import type { FlatAdminCategory } from '@/types/category';

type Props = {
  category: FlatAdminCategory;
  onSaved?: () => void;
};

export function CategoryDetailsLegacySectionId({ category, onSaved }: Props) {
  const [value, setValue] = React.useState(category.legacySectionId ?? '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isLeaf = category.isLeaf === true;
  const hasChange = value !== (category.legacySectionId ?? '');

  React.useEffect(() => {
    setValue(category.legacySectionId ?? '');
  }, [category.id, category.legacySectionId]);

  const handleSave = async () => {
    if (!hasChange) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.name,
          parentId: category.parentId,
          urlSegment: category.segment,
          slug: category.slug,
          isActive: category.isActive,
          legacySectionId: value.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'Не удалось сохранить');
        return;
      }
      onSaved?.();
    } catch (e) {
      setError('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  if (!isLeaf) return null;

  return (
    <div className="space-y-3 border-t border-gray-200 pt-4">
      <div className="space-y-2">
        <Label className="block text-sm font-medium text-gray-900">
          ID раздела на старом портале
        </Label>
        <p className="text-xs text-gray-500">
          Используется в экспорте (колонка sectionid). Заполняется только для конечных категорий.
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Например: 123"
            className="font-mono"
            disabled={saving}
          />
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChange}
          >
            {saving ? (
              <Loader size="sm" className="[&>div]:border-t-purple-600" />
            ) : (
              'Сохранить'
            )}
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import {
  CategorySelector,
  type CategoryNode,
} from '@/components/ui/CategorySelector';
import type { FlatAdminCategory, AdminCategoryNode } from '@/types/category';
import { slugify } from '@/utils/slugify';
import { CategoryIconSelector, type CategoryIconName } from './CategoryIconSelector';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  parents: FlatAdminCategory[];
  parentId: string | null;
  category?: AdminCategoryNode | null;
  onSuccess: (categoryId: string) => void;
};

type FormState = {
  name: string;
  parentId: string | null;
  urlSegment: string;
  isActive: boolean;
  icon: CategoryIconName;
};

const initialState: FormState = {
  name: '',
  parentId: null,
  urlSegment: '',
  isActive: true,
  icon: null,
};

function generateUrlSegment(
  name: string,
  parentId: string | null,
  parents: FlatAdminCategory[]
): string {
  if (!name.trim()) return '';
  return slugify(name);
}

function capitalizeFirstLetter(str: string): string {
  if (!str.trim()) return str;
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// Convert flat category list to tree structure for CategorySelector
function buildCategoryTree(
  flatCategories: FlatAdminCategory[]
): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  // First pass: create all nodes
  flatCategories.forEach(cat => {
    const node: CategoryNode = {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      path: cat.path,
      children: [],
    };
    categoryMap.set(cat.id, node);
  });

  // Second pass: build tree structure
  flatCategories.forEach(cat => {
    const node = categoryMap.get(cat.id)!;
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  // Sort by name for consistent display
  const sortTree = (nodes: CategoryNode[]): CategoryNode[] => {
    return nodes
      .map(node => ({
        ...node,
        children: node.children ? sortTree(node.children) : [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  return sortTree(roots);
}

export function CategoryModal({
  isOpen,
  onClose,
  parents,
  parentId: initialParentId,
  category,
  onSuccess,
}: Props) {
  const isEdit = Boolean(category);
  const [form, setForm] = React.useState<FormState>(initialState);
  const [status, setStatus] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Initialize form when modal opens or category changes
  React.useEffect(() => {
    if (isOpen) {
      if (category) {
        setForm({
          name: category.name,
          parentId: category.parentId || null,
          urlSegment: category.segment,
          isActive: category.isActive,
          icon: (category.icon as CategoryIconName) || null,
        });
      } else {
        setForm({
          ...initialState,
          parentId: initialParentId || null,
        });
      }
      setStatus(null);
    }
  }, [isOpen, category, initialParentId]);

  // Auto-generate URL segment when name or parent changes
  React.useEffect(() => {
    if (!isEdit && form.name) {
      const generated = generateUrlSegment(
        form.name,
        form.parentId || null,
        parents
      );
      setForm(prev => ({ ...prev, urlSegment: generated }));
    }
  }, [form.name, form.parentId, parents, isEdit]);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setStatus({
        type: 'error',
        text: 'Заполните название',
      });
      return;
    }

    const urlSegment = form.urlSegment.trim() || slugify(form.name);
    if (!urlSegment) {
      setStatus({
        type: 'error',
        text: 'Не удалось сгенерировать URL сегмент',
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatus(null);

      if (isEdit && category) {
        // Update existing category
        const response = await fetch(`/api/admin/categories/${category.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: capitalizeFirstLetter(form.name),
            parentId: form.parentId || null,
            urlSegment,
            isActive: form.isActive,
            icon: !form.parentId ? form.icon : null, // Only save icon for first-level categories
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data?.error || 'Ошибка обновления категории');
        }
        setStatus({ type: 'success', text: 'Категория обновлена' });
        setTimeout(() => {
          onSuccess(category.id);
          onClose();
        }, 500);
      } else {
        // Create new category
        const response = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: capitalizeFirstLetter(form.name),
            parentId: form.parentId || null,
            urlSegment,
            isActive: form.isActive,
            icon: !form.parentId ? form.icon : null, // Only save icon for first-level categories
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data?.error || 'Ошибка создания категории');
        }
        setStatus({ type: 'success', text: 'Категория создана' });
        setTimeout(() => {
          onSuccess(data.item.id as string);
          onClose();
        }, 500);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Произошла ошибка';
      setStatus({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  };

  // Convert flat categories to tree for CategorySelector
  // Exclude the current category being edited to prevent circular references
  const categoryTree = React.useMemo(() => {
    const filteredParents =
      isEdit && category ? parents.filter(p => p.id !== category.id) : parents;
    return buildCategoryTree(filteredParents);
  }, [parents, isEdit, category]);

  const selectedParent = form.parentId
    ? parents.find(p => p.id === form.parentId)
    : null;
  const finalPath = selectedParent
    ? `/catalog${selectedParent.urlPath ? `/${selectedParent.urlPath}` : ''}/${form.urlSegment || '...'}`
    : `/catalog/${form.urlSegment || '...'}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Редактировать категорию' : 'Создать категорию'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="category-name"
                  className="block text-sm font-medium"
                >
                  Название <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="category-name"
                  placeholder="Например, Ботинки"
                  value={form.name}
                  onChange={event => updateField('name', event.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="category-parent"
                  className="block text-sm font-medium"
                >
                  Родитель
                </Label>
                <CategorySelector
                  value={form.parentId}
                  onChange={categoryId => updateField('parentId', categoryId)}
                  categories={categoryTree}
                  placeholder="Корневой уровень"
                  allowNonLeafSelection={true}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="category-segment"
                  className="block text-sm font-medium"
                >
                  URL сегмент
                </Label>
                <Input
                  id="category-segment"
                  placeholder="Автоматически"
                  value={form.urlSegment}
                  readOnly
                  className="h-10 bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500">
                  Итоговый путь: <span className="font-mono">{finalPath}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label className="block text-sm font-medium text-gray-900">
                  Показывать на сайте
                </Label>
                <div className="flex h-10 items-center">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={value => updateField('isActive', value)}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Черновики сохраняются, но не попадают в каталог.
                </p>
              </div>
            </div>

            {/* Icon selector - only for first-level categories (no parent) */}
            {!form.parentId && (
              <CategoryIconSelector
                value={form.icon}
                onChange={icon => updateField('icon', icon)}
              />
            )}
          </div>

          {/* Status Messages */}
          {status && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                status.type === 'success'
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : 'border border-red-200 bg-red-50 text-red-600'
              }`}
            >
              {status.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? isEdit
                  ? 'Сохранение...'
                  : 'Создание...'
                : isEdit
                  ? 'Сохранить'
                  : 'Создать категорию'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

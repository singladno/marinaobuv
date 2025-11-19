'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import type { FlatAdminCategory } from '@/types/category';
import { slugify } from '@/utils/slugify';

type Props = {
  parents: FlatAdminCategory[];
  defaultParentId: string | null;
  onCreated: (categoryId: string) => void;
};

type FormState = {
  name: string;
  parentId: string;
  urlSegment: string;
  sort: string;
  isActive: boolean;
};

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-none outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200';

const initialState: FormState = {
  name: '',
  parentId: '',
  urlSegment: '',
  sort: '500',
  isActive: true,
};

type Status = { type: 'success' | 'error'; text: string } | null;

type Controller = {
  form: FormState;
  status: Status;
  submitting: boolean;
  customSegment: boolean;
  setCustomSegment: (value: boolean) => void;
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  submit: () => Promise<void>;
};

function useCategoryCreateController(
  defaultParentId: string | null,
  onCreated: (categoryId: string) => void
): Controller {
  const [form, setForm] = React.useState<FormState>({
    ...initialState,
    parentId: defaultParentId ?? '',
  });
  const [customSegment, setCustomSegment] = React.useState(false);
  const [status, setStatus] = React.useState<Status>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!defaultParentId) return;
    setForm(prev => ({ ...prev, parentId: defaultParentId }));
  }, [defaultParentId]);

  const updateField = React.useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const submit = React.useCallback(async () => {
    if (!form.name.trim() || !form.parentId || !form.urlSegment.trim()) {
      setStatus({
        type: 'error',
        text: 'Заполните название, родителя и сегмент URL',
      });
      return;
    }

    try {
      setSubmitting(true);
      setStatus(null);
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          parentId: form.parentId,
          urlSegment: form.urlSegment.trim(),
          sort: Number(form.sort) || 500,
          isActive: form.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error || 'Ошибка создания категории');
      }
      setStatus({ type: 'success', text: 'Категория создана' });
      setForm(prev => ({
        ...initialState,
        parentId: prev.parentId,
      }));
      setCustomSegment(false);
      onCreated(data.item.id as string);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ошибка создания категории';
      setStatus({ type: 'error', text: message });
    } finally {
      setSubmitting(false);
    }
  }, [form, onCreated]);

  return {
    form,
    status,
    submitting,
    customSegment,
    setCustomSegment,
    updateField,
    submit,
  };
}

export function CategoryCreatePanel({
  parents,
  defaultParentId,
  onCreated,
}: Props) {
  const controller = useCategoryCreateController(defaultParentId, onCreated);

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <p className="text-sm font-semibold text-gray-900">Создать категорию</p>
        <p className="text-xs text-gray-500">
          Название, родитель и URL сегмент формируют новую страницу каталога.
        </p>
      </CardHeader>
      <CardContent className="p-4">
        <CategoryCreateFields parents={parents} controller={controller} />
      </CardContent>
    </Card>
  );
}

type FieldsProps = {
  parents: FlatAdminCategory[];
  controller: Controller;
};

function CategoryCreateFields({ parents, controller }: FieldsProps) {
  const {
    form,
    status,
    submitting,
    customSegment,
    setCustomSegment,
    updateField,
    submit,
  } = controller;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category-name">Название *</Label>
          <Input
            id="category-name"
            placeholder="Например, Ботинки"
            value={form.name}
            onChange={event => {
              const value = event.target.value;
              updateField('name', value);
              if (!customSegment) {
                updateField('urlSegment', slugify(value));
              }
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category-parent">Родитель *</Label>
          <select
            id="category-parent"
            className={SELECT_CLASS}
            value={form.parentId}
            onChange={event => updateField('parentId', event.target.value)}
          >
            <option value="">Выберите категорию</option>
            {parents.map(parent => (
              <option key={parent.id} value={parent.id}>
                {'‣ '.repeat(parent.depth)} {parent.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="category-segment">URL сегмент *</Label>
          <Input
            id="category-segment"
            placeholder="sneakers"
            value={form.urlSegment}
            onChange={event => {
              setCustomSegment(true);
              updateField('urlSegment', slugify(event.target.value));
            }}
          />
          <p className="text-xs text-gray-500">
            Итоговый путь: /catalog/.../{'{segment}'}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category-sort">Порядок</Label>
          <Input
            id="category-sort"
            type="number"
            value={form.sort}
            onChange={event => updateField('sort', event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-gray-900">Показывать на сайте</p>
          <p className="text-xs text-gray-500">
            Черновики сохраняются, но не попадают в каталог.
          </p>
        </div>
        <Switch
          checked={form.isActive}
          onCheckedChange={value => updateField('isActive', value)}
        />
      </div>

      {status && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            status.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {status.text}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Создание...' : 'Создать категорию'}
      </Button>
    </form>
  );
}

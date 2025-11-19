'use client';

import { useEffect, useState, type KeyboardEvent, type RefObject } from 'react';

import { Textarea } from '@/components/ui/Textarea';

type ProductDescriptionEditorProps = {
  value: string;
  isExpanded: boolean;
  isLoading: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
  onChange: (next: string) => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onInput: () => void;
  onCollapse: () => void;
};

export function ProductDescriptionEditor({
  value,
  isExpanded,
  isLoading,
  textareaRef,
  disabled,
  onChange,
  onBlur,
  onKeyDown,
  onInput,
  onCollapse,
}: ProductDescriptionEditorProps) {
  const [shouldRenderContent, setShouldRenderContent] = useState(isExpanded);

  useEffect(() => {
    if (isExpanded) {
      setShouldRenderContent(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRenderContent(false);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [isExpanded]);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-purple-100 bg-white shadow transition-all duration-300 dark:border-purple-900/50 dark:bg-gray-900 ${
        isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      {shouldRenderContent && (
        <div
          className={`space-y-2 p-3 transition-all duration-300 ${
            isExpanded
              ? 'translate-y-0 opacity-100'
              : '-translate-y-2 opacity-0'
          }`}
        >
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            onInput={onInput}
            disabled={disabled}
            className="w-full resize-none"
            style={{ overflow: 'hidden', maxHeight: 'none' }}
            rows={2}
            placeholder="Описание товара..."
          />
          <div className="flex items-center justify-end gap-3 text-xs text-gray-500">
            {isLoading && <span>Сохранение...</span>}
            <button
              type="button"
              onClick={onCollapse}
              className="cursor-pointer font-medium text-purple-600 transition-colors hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200"
            >
              Скрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

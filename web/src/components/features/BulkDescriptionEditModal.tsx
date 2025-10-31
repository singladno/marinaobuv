'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

type BulkMode = 'prepend' | 'append' | 'replace' | null;

interface BulkDescriptionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (options: {
    mode: Exclude<BulkMode, null>;
    value?: string;
    replaceFrom?: string;
    replaceTo?: string;
  }) => Promise<void> | void;
  isProcessing?: boolean;
}

export default function BulkDescriptionEditModal({
  isOpen,
  onClose,
  onApply,
  isProcessing = false,
}: BulkDescriptionEditModalProps) {
  const [prependText, setPrependText] = useState('');
  const [appendText, setAppendText] = useState('');
  const [replaceFrom, setReplaceFrom] = useState('');
  const [replaceTo, setReplaceTo] = useState('');
  const [mode, setMode] = useState<BulkMode>(null);

  useEffect(() => {
    if (!isOpen) {
      setPrependText('');
      setAppendText('');
      setReplaceFrom('');
      setReplaceTo('');
      setMode(null);
    }
  }, [isOpen]);

  const handleApply = async () => {
    if (!mode) return;
    if (mode === 'prepend') {
      await onApply({ mode, value: prependText });
      return;
    }
    if (mode === 'append') {
      await onApply({ mode, value: appendText });
      return;
    }
    await onApply({ mode: 'replace', replaceFrom, replaceTo });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Массовое редактирование описаний"
    >
      <div className="space-y-4 px-6 py-6">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            variant={mode === 'prepend' ? 'primary' : 'outline'}
            size="sm"
            className="w-full"
            onClick={() => setMode('prepend')}
            disabled={isProcessing}
          >
            Добавить в начало
          </Button>
          <Button
            variant={mode === 'append' ? 'primary' : 'outline'}
            size="sm"
            className="w-full"
            onClick={() => setMode('append')}
            disabled={isProcessing}
          >
            Добавить в конец
          </Button>
          <Button
            variant={mode === 'replace' ? 'primary' : 'outline'}
            size="sm"
            className="w-full"
            onClick={() => setMode('replace')}
            disabled={isProcessing}
          >
            Заменить
          </Button>
        </div>

        {mode === 'prepend' && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Текст для добавления в начале
            </label>
            <Input
              value={prependText}
              onChange={e => setPrependText(e.target.value)}
              placeholder="Например: Новинка! "
            />
          </div>
        )}

        {mode === 'append' && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Текст для добавления в конце
            </label>
            <Input
              value={appendText}
              onChange={e => setAppendText(e.target.value)}
              placeholder="Например: Бесплатная доставка"
            />
          </div>
        )}

        {mode === 'replace' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Заменить — что найти
              </label>
              <Input
                value={replaceFrom}
                onChange={e => setReplaceFrom(e.target.value)}
                placeholder="Исходный текст"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Заменить — на что
              </label>
              <Input
                value={replaceTo}
                onChange={e => setReplaceTo(e.target.value)}
                placeholder="Новый текст"
              />
            </div>
          </div>
        )}

        <Text className="text-muted-foreground text-xs">
          Выберите действие и заполните поля. Изменения применятся ко всем
          товарам закупки.
        </Text>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Отмена
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              isProcessing ||
              !mode ||
              (mode === 'prepend' && prependText.trim() === '') ||
              (mode === 'append' && appendText.trim() === '') ||
              (mode === 'replace' && replaceFrom.trim() === '')
            }
          >
            {isProcessing ? 'Применение…' : 'Применить ко всем'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

interface CreatePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  isLoading?: boolean;
}

export function CreatePurchaseModal({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: CreatePurchaseModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreate(name.trim());
      setName('');
      onClose();
    } catch (error) {
      console.error('Error creating purchase:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать закупку"
      size="sm"
    >
      <div className="px-6 py-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-3">
              <Text
                variant="body"
                className="font-medium text-gray-900 dark:text-white"
              >
                Название закупки
              </Text>
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Введите название закупки..."
                disabled={isSubmitting}
                required
                autoFocus
                fullWidth
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!name.trim() || isSubmitting || isLoading}
                className="!bg-gradient-to-r !from-violet-600 !to-violet-700 !text-white"
              >
                {isSubmitting ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

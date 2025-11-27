'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { useCreateProviderForm } from '@/hooks/useCreateProviderForm';
import { CreateProviderFormFields } from '@/components/admin/CreateProviderFormFields';

interface CreateProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (provider: { name: string; phone?: string; place?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateProviderModal({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: CreateProviderModalProps) {
  const { formData, isSubmitting, error, updateField, reset, submit } = useCreateProviderForm();

  const handleCreate = async () => {
    if (!formData.name.trim() || isSubmitting) return;

    try {
      await submit(onCreate);
      // Close modal after successful creation
      onClose();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => handleClose()}
      title="Создать поставщика"
      size="sm"
      zIndex="z-[60]"
    >
      <div className="px-6 py-6">
        <div className="space-y-6">
          <CreateProviderFormFields
            formData={formData}
            updateField={updateField}
            isSubmitting={isSubmitting}
          />

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <Text variant="caption" className="text-red-600 dark:text-red-400">
                {error}
              </Text>
            </div>
          )}

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
              type="button"
              variant="primary"
              onClick={handleCreate}
              disabled={!formData.name.trim() || isSubmitting || isLoading}
              className="!bg-gradient-to-r !from-violet-600 !to-violet-700 !text-white"
            >
              {isSubmitting ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

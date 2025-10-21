'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Upload,
  Camera,
  Trash2,
  Check,
  X as XIcon,
  Trash,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface MediaAttachment {
  id: string;
  type: string;
  name: string;
  size?: number;
  data?: string;
  url?: string;
}

interface AdminReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    replacementImageUrl?: string;
    replacementImageKey?: string;
    adminComment?: string;
  }) => Promise<void>;
  itemName: string;
  availableImages?: MediaAttachment[];
  loading?: boolean;
  existingReplacement?: {
    id: string;
    replacementImageUrl: string | null;
    replacementImageKey: string | null;
    adminComment: string | null;
  } | null;
}

export function AdminReplacementModal({
  isOpen,
  onClose,
  onSubmit,
  itemName,
  availableImages = [],
  loading = false,
  existingReplacement = null,
}: AdminReplacementModalProps) {
  const [selectedImage, setSelectedImage] = useState<MediaAttachment | null>(
    null
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [adminComment, setAdminComment] = useState(
    existingReplacement?.adminComment || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelect = (image: MediaAttachment) => {
    setSelectedImage(image);
    setUploadedFile(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setSelectedImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage && !uploadedFile) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        adminComment: adminComment.trim() || undefined,
      };

      if (selectedImage) {
        submitData.replacementImageUrl =
          selectedImage.url || selectedImage.data;
        submitData.replacementImageKey = selectedImage.id;
      } else if (uploadedFile) {
        // In a real implementation, you would upload the file here
        // For now, we'll create a data URL
        const reader = new FileReader();
        reader.onload = async e => {
          submitData.replacementImageUrl = e.target?.result as string;
          await onSubmit(submitData);
        };
        reader.readAsDataURL(uploadedFile);
        return;
      }

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error('Failed to submit replacement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setUploadedFile(null);
    setAdminComment('');
    setIsSubmitting(false);
    onClose();
  };

  const getImagePreview = () => {
    if (selectedImage) {
      return (
        <div className="relative">
          <Image
            src={selectedImage.url || selectedImage.data || ''}
            alt={selectedImage.name}
            width={200}
            height={200}
            className="rounded-lg object-cover"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-red-300 bg-white shadow-md hover:bg-red-50"
            title="Удалить изображение"
          >
            <Trash className="h-3 w-3 text-red-600" />
          </button>
        </div>
      );
    }

    if (uploadedFile) {
      return (
        <div className="relative">
          <Image
            src={URL.createObjectURL(uploadedFile)}
            alt={uploadedFile.name}
            width={200}
            height={200}
            className="rounded-lg object-cover"
          />
          <button
            onClick={() => setUploadedFile(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-red-300 bg-white shadow-md hover:bg-red-50"
            title="Удалить изображение"
          >
            <Trash className="h-3 w-3 text-red-600" />
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        existingReplacement
          ? 'Изменить предложение о замене'
          : 'Предложить замену'
      }
      size="lg"
    >
      <div className="space-y-4 p-6">
        {/* Item Info */}
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <Camera className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {itemName}
            </span>
          </div>
        </div>
        {/* Available Images from Chat */}
        {availableImages.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Выберите из чата ({availableImages.length} изображений):
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {availableImages.map(image => (
                <button
                  key={image.id}
                  onClick={() => handleImageSelect(image)}
                  className={cn(
                    'relative overflow-hidden rounded-lg border-2 transition-all',
                    selectedImage?.id === image.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Image
                    src={image.url || image.data || ''}
                    alt={image.name}
                    width={80}
                    height={80}
                    className="h-16 w-full object-cover"
                  />
                  {selectedImage?.id === image.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 shadow-lg">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Изображения из чата:
            </h4>
            <div className="rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              Нет изображений в чате для этого товара
            </div>
          </div>
        )}

        {/* Upload New Image */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Или загрузите новое:
          </h4>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              disabled={isSubmitting}
            >
              <Upload className="mr-2 h-4 w-4" />
              Выбрать файл
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Выберите изображение для замены"
            />
            {uploadedFile && (
              <div className="flex items-center space-x-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
                <Camera className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 dark:text-green-200">
                  {uploadedFile.name}
                </span>
                <Button
                  onClick={() => setUploadedFile(null)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {getImagePreview() && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Предварительный просмотр:
            </h4>
            <div className="flex justify-center">{getImagePreview()}</div>
          </div>
        )}

        {/* Admin Comment */}
        <div className="space-y-3">
          <div className="flex flex-col space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Комментарий для клиента:
            </label>
            <Textarea
              value={adminComment}
              onChange={e => setAdminComment(e.target.value)}
              placeholder="Объясните, почему предлагаете эту замену..."
              className="min-h-[60px] w-full"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={(!selectedImage && !uploadedFile) || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Отправка...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {existingReplacement
                  ? 'Обновить предложение'
                  : 'Предложить замену'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

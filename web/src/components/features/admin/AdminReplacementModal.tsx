'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Camera, Trash2, Check, X as XIcon } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
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
}

export function AdminReplacementModal({
  isOpen,
  onClose,
  onSubmit,
  itemName,
  availableImages = [],
  loading = false,
}: AdminReplacementModalProps) {
  const [selectedImage, setSelectedImage] = useState<MediaAttachment | null>(
    null
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [adminComment, setAdminComment] = useState('');
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
          <Button
            onClick={() => setSelectedImage(null)}
            variant="danger"
            size="sm"
            className="absolute -right-2 -top-2 h-6 w-6 p-0"
          >
            <XIcon className="h-3 w-3" />
          </Button>
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
          <Button
            onClick={() => setUploadedFile(null)}
            variant="danger"
            size="sm"
            className="absolute -right-2 -top-2 h-6 w-6 p-0"
          >
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <h3 className="text-lg font-semibold">Предложить замену</h3>
            <p className="truncate text-sm text-gray-600 dark:text-gray-400">
              {itemName}
            </p>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="max-h-[calc(90vh-120px)] space-y-6 overflow-y-auto">
          {/* Available Images from Chat */}
          {availableImages.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Выберите изображение из чата:
              </h4>
              <div className="grid grid-cols-3 gap-3">
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
                      width={100}
                      height={100}
                      className="h-24 w-full object-cover"
                    />
                    {selectedImage?.id === image.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-20">
                        <Check className="h-6 w-6 text-blue-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Image */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Или загрузите новое изображение:
            </h4>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center space-x-2"
                disabled={isSubmitting}
              >
                <Upload className="h-4 w-4" />
                <span>Выбрать файл</span>
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
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <Camera className="h-3 w-3" />
                  <span>{uploadedFile.name}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {getImagePreview() && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Предварительный просмотр:
              </h4>
              {getImagePreview()}
            </div>
          )}

          {/* Admin Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Комментарий для клиента (необязательно):
            </label>
            <Textarea
              value={adminComment}
              onChange={e => setAdminComment(e.target.value)}
              placeholder="Объясните, почему предлагаете эту замену..."
              className="min-h-[80px]"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 border-t pt-4">
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
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Отправка...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Предложить замену</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

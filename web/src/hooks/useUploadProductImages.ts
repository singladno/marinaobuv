import { useState } from 'react';

interface ImageFile {
  file: File;
  preview: string;
  id: string;
  color: string;
  isPrimary: boolean;
}

interface UploadResult {
  url: string;
  key: string;
  alt: string | null;
  sort: number;
  isPrimary: boolean;
}

export function useUploadProductImages() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const uploadImages = async (
    productId: string,
    images: ImageFile[]
  ): Promise<UploadResult[]> => {
    if (images.length === 0) return [];

    setIsUploading(true);
    setUploadProgress({});

    try {
      const uploadResults: UploadResult[] = [];

      // Sort images: primary first, then by original order
      const sortedImages = [...images].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return 0;
      });

      for (let i = 0; i < sortedImages.length; i++) {
        const image = sortedImages[i];
        const imageId = image.id;

        try {
          setUploadProgress(prev => ({ ...prev, [imageId]: 50 }));

          // Upload file through backend API (avoids CORS issues)
          const formData = new FormData();
          formData.append('file', image.file);
          formData.append('color', image.color || '');
          formData.append('isPrimary', String(image.isPrimary));
          formData.append('sort', String(i));

          const uploadResponse = await fetch(
            `/api/admin/products/${productId}/images/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(
              errorData.error || 'Failed to upload image'
            );
          }

          setUploadProgress(prev => ({ ...prev, [imageId]: 100 }));

          const { image: createdImage } = await uploadResponse.json();
          uploadResults.push({
            url: createdImage.url,
            key: createdImage.key || '',
            alt: createdImage.alt,
            sort: createdImage.sort,
            isPrimary: createdImage.isPrimary,
          });
        } catch (error) {
          console.error(`Error uploading image ${i + 1}:`, error);
          // Continue with other images
        }
      }

      return uploadResults;
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  return {
    uploadImages,
    isUploading,
    uploadProgress,
  };
}


import { useState } from 'react';

import type { VideoFile } from '@/components/admin/ProductVideoUpload';

interface UploadResult {
  url: string;
  key: string;
  alt: string | null;
  sort: number;
}

export function useUploadProductVideos() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  const uploadVideos = async (
    productId: string,
    videos: VideoFile[]
  ): Promise<UploadResult[]> => {
    if (videos.length === 0) return [];

    setIsUploading(true);
    setUploadProgress({});

    try {
      const uploadResults: UploadResult[] = [];

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const videoId = video.id;

        try {
          setUploadProgress(prev => ({ ...prev, [videoId]: 50 }));

          // Upload file through backend API
          const formData = new FormData();
          formData.append('file', video.file!);
          formData.append('alt', video.alt || '');
          formData.append('sort', String(i));

          const uploadResponse = await fetch(
            `/api/admin/products/${productId}/videos/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to upload video');
          }

          setUploadProgress(prev => ({ ...prev, [videoId]: 100 }));

          const { video: createdVideo } = await uploadResponse.json();
          uploadResults.push({
            url: createdVideo.url,
            key: createdVideo.key || '',
            alt: createdVideo.alt,
            sort: createdVideo.sort,
          });
        } catch (error) {
          console.error(`Error uploading video ${i + 1}:`, error);
          // Continue with other videos
        }
      }

      return uploadResults;
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  return {
    uploadVideos,
    isUploading,
    uploadProgress,
  };
}

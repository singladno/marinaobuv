import type { Draft } from '@/types/admin';

import { ImageGallery } from './ImageGallery';

interface ImagesCellProps {
  draftId: string;
  images: Draft['images'];
  onImageToggle?: (imageId: string, isActive: boolean) => Promise<void>;
  onReload?: () => void;
}

export function ImagesCell({
  draftId,
  images,
  onImageToggle,
  onReload,
}: ImagesCellProps) {
  return (
    <ImageGallery
      draftId={draftId}
      images={images}
      onImageToggle={onImageToggle}
      onReload={onReload}
    />
  );
}

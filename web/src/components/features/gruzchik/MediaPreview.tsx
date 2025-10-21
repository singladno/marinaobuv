'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, FileText, Video, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

export interface MediaItem {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'document';
  progress?: number;
  isUploading?: boolean;
}

interface MediaPreviewProps {
  mediaItems: MediaItem[];
  onRemove: (id: string) => void;
  className?: string;
}

export function MediaPreview({
  mediaItems,
  onRemove,
  className,
}: MediaPreviewProps) {
  if (mediaItems.length === 0) return null;

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Camera className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('flex flex-wrap gap-2 p-2', className)}>
      {mediaItems.map(item => (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Media Preview */}
          <div className="relative h-20 w-20">
            {item.type === 'image' && item.preview ? (
              <Image
                src={item.preview}
                alt={item.file.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                {getFileIcon(item.type)}
              </div>
            )}

            {/* Upload Progress Overlay */}
            {item.isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="h-8 w-8">
                  <Progress
                    value={item.progress || 0}
                    className="h-full w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-white">
            <div className="truncate text-xs">{item.file.name}</div>
            <div className="text-xs opacity-75">
              {formatFileSize(item.file.size)}
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-red-500 p-0 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';

interface ProductVideoUploadAreaProps {
  onFilesSelect: (files: FileList) => void;
  disabled?: boolean;
  maxVideos?: number;
  currentCount?: number;
}

export function ProductVideoUploadArea({
  onFilesSelect,
  disabled = false,
  maxVideos = 5,
  currentCount = 0,
}: ProductVideoUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canAddMore = currentCount < maxVideos;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || !canAddMore) return;
    if (e.dataTransfer.files) {
      onFilesSelect(e.dataTransfer.files);
    }
  };

  if (!canAddMore) return null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-lg border-2 border-dashed p-4 transition-colors ${
        isDragging
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
        aria-label="Выберите видео"
      />
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <VideoCameraIcon className="h-8 w-8 text-gray-400" />
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-purple-600 dark:text-purple-400">
            Нажмите для загрузки
          </span>{' '}
          или перетащите видео сюда
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          До {maxVideos} видео (MP4, WebM)
        </div>
      </div>
    </div>
  );
}

'use client';

import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';

interface ProductImageColorInputProps {
  imageId: string;
  color: string;
  onChange: (imageId: string, color: string) => void;
  disabled?: boolean;
  error?: string;
}

export function ProductImageColorInput({
  imageId,
  color,
  onChange,
  disabled = false,
  error,
}: ProductImageColorInputProps) {
  return (
    <div className="space-y-1">
      <Text variant="caption" className="text-xs text-gray-600 dark:text-gray-400">
        Цвет <span className="text-red-500">*</span>
      </Text>
      <Input
        type="text"
        value={color}
        onChange={e => onChange(imageId, e.target.value)}
        placeholder="Например: Черный"
        disabled={disabled}
        required
        fullWidth
        className={`text-sm ${error ? 'border-red-500' : ''}`}
      />
      {error && (
        <Text variant="caption" className="text-xs text-red-500">
          {error}
        </Text>
      )}
    </div>
  );
}


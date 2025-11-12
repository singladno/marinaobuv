'use client';

import { useState, useEffect, useRef } from 'react';
import { log } from '@/lib/logger';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { getColorHex } from '@/utils/colorMapping';

import FilterPill from './FilterPill';

interface ColorOption {
  name: string;
  value: string;
  hex: string;
}

interface ColorFilterProps {
  value: string[];
  onChange: (colors: string[]) => void;
  categoryId?: string;
}

export default function ColorFilter({
  value,
  onChange,
  categoryId,
}: ColorFilterProps) {
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const inFlightKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        // If categoryId is an empty string, wait for the real value to avoid duplicate fetch
        if (categoryId === '') {
          log.info('⏳ Skipping colors fetch until categoryId is known');
          return;
        }

        // Build URL with categoryId parameter if provided, undefined means global colors
        const url =
          categoryId === undefined
            ? '/api/colors'
            : `/api/colors?categoryId=${encodeURIComponent(categoryId)}`;

        if (inFlightKeyRef.current === url) {
          log.info('🛑 Skipping duplicate colors fetch', url);
          return;
        }
        inFlightKeyRef.current = url;

        log.group('🎨 Colors fetch START', url);
        const response = await fetch(url);
        const data = await response.json();

        if (data.colors) {
          const colorOptions = data.colors.map((colorName: string) => ({
            name: colorName,
            value: colorName,
            hex: getColorHex(colorName),
          }));
          setColors(colorOptions);
          log.info('🎨 Colors fetched', { count: colorOptions.length });
        }
        log.groupEnd();
      } catch (error) {
        log.error('Error fetching colors', error);
      } finally {
        setLoading(false);
        inFlightKeyRef.current = null;
      }
    };

    fetchColors();
  }, [categoryId]);

  const handleColorToggle = (colorValue: string) => {
    const newColors = value.includes(colorValue)
      ? value.filter(c => c !== colorValue)
      : [...value, colorValue];
    onChange(newColors);
  };

  if (loading) {
    return (
      <FilterPill label="Цвет" disabled={true} contentClassName="w-80">
        <div className="p-3 text-center text-sm text-gray-500">
          Загрузка цветов...
        </div>
      </FilterPill>
    );
  }

  return (
    <FilterPill
      label="Цвет"
      badgeCount={value.length}
      isActive={value.length > 0}
      onClear={() => onChange([])}
      contentClassName="w-80 p-0"
    >
      <div className="max-h-80 overflow-y-auto p-3">
        {colors.map(color => (
          <label
            key={color.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg py-2 hover:bg-gray-50"
            onClick={e => e.stopPropagation()}
          >
            <Checkbox
              checked={value.includes(color.value)}
              onCheckedChange={() => handleColorToggle(color.value)}
            />
            <div
              className="h-6 w-6 rounded-full border border-gray-300"
              style={{ backgroundColor: color.hex }}
              aria-label={`Color ${color.name}`}
            />
            <span
              className={`text-sm capitalize ${
                value.includes(color.value)
                  ? 'font-medium text-purple-700'
                  : 'text-gray-800'
              }`}
            >
              {color.name}
            </span>
          </label>
        ))}
      </div>
    </FilterPill>
  );
}

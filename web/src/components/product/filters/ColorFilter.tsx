'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

import FilterPill from './FilterPill';

interface ColorOption {
  name: string;
  value: string;
  hex: string;
}

interface ColorFilterProps {
  value: string[];
  onChange: (colors: string[]) => void;
}

// Color mapping from Russian names to hex values
const COLOR_MAP: Record<string, string> = {
  белый: '#FFFFFF',
  черный: '#000000',
  красный: '#FF0000',
  синий: '#0000FF',
  зеленый: '#008000',
  желтый: '#FFFF00',
  оранжевый: '#FFA500',
  розовый: '#FFC0CB',
  фиолетовый: '#800080',
  коричневый: '#A52A2A',
  серый: '#808080',
  бежевый: '#F5F5DC',
  голубой: '#87CEEB',
  бордовый: '#800020',
  магнета: '#FF00FF',
  фуксия: '#FF00FF',
};

export default function ColorFilter({ value, onChange }: ColorFilterProps) {
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch('/api/colors');
        const data = await response.json();

        if (data.colors) {
          const colorOptions = data.colors.map((colorName: string) => ({
            name: colorName,
            value: colorName,
            hex: COLOR_MAP[colorName.toLowerCase()] || '#808080',
          }));
          setColors(colorOptions);
        }
      } catch (error) {
        console.error('Error fetching colors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchColors();
  }, []);

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

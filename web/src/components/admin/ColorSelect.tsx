'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import * as React from 'react';

import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select';
import ColorIndicator from '@/components/product/ColorIndicator';

interface ColorSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

/**
 * Convert color to title case (first letter uppercase, rest lowercase)
 */
function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function ColorSelect({
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  required = false,
}: ColorSelectProps) {
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch('/api/admin/products/colors');
        if (!response.ok) {
          throw new Error('Failed to fetch colors');
        }
        const data = await response.json();
        if (data.colors) {
          setColors(data.colors);
        }
      } catch (error) {
        console.error('Error fetching colors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchColors();
  }, []);

  // Filter colors based on search query
  const filteredColors = useMemo(() => {
    if (!searchQuery.trim()) {
      return colors;
    }
    const query = searchQuery.toLowerCase();
    return colors.filter(color =>
      color.toLowerCase().includes(query)
    );
  }, [colors, searchQuery]);

  const handleValueChange = (newValue: string) => {
    // Value is already lowercase from SelectItem, but ensure it's lowercase
    onChange(newValue.toLowerCase());
    setSearchQuery(''); // Clear search on selection
    if (onBlur) {
      onBlur();
    }
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    // Use a mutation observer to detect when SelectContent is rendered
    const observer = new MutationObserver(() => {
      const content = document.querySelector('[data-select-content]');
      if (content && searchInputRef.current) {
        // Small delay to ensure the input is rendered
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      } else {
        // Clear search when dropdown closes
        setSearchQuery('');
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="space-y-1">
        <Select disabled>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Загрузка..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Select
        value={value ? value.toLowerCase() : ''}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={`text-sm ${error ? 'border-red-500' : ''}`}
        >
          <SelectValue placeholder="Выберите цвет">
            {value ? toTitleCase(value) : ''}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="p-0">
          <div ref={contentRef} className="w-full min-w-0">
            {/* Search Input */}
            <div
              className="sticky top-0 z-10 w-full min-w-0 border-b border-gray-200 bg-white p-2 dark:bg-gray-800"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative w-full min-w-0">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Поиск цвета..."
                  className="w-full pl-9 pr-3 text-sm"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    e.stopPropagation();
                    // Prevent closing dropdown on Enter
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Select first filtered result if available
                      if (filteredColors.length > 0) {
                        handleValueChange(filteredColors[0].toLowerCase());
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Color List */}
            <div className="max-h-[240px] w-full min-w-0 overflow-y-auto overflow-x-hidden">
              {filteredColors.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  Цвет не найден
                </div>
              ) : (
                filteredColors.map(color => (
                  <SelectItem
                    key={color.toLowerCase()}
                    value={color.toLowerCase()}
                    className="w-full min-w-0"
                  >
                    <div className="flex w-full min-w-0 items-center gap-2">
                      <ColorIndicator colorName={color} size="sm" className="flex-shrink-0" />
                      <span className="truncate flex-1 min-w-0">{color}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </div>
          </div>
        </SelectContent>
      </Select>
      {error && (
        <Text variant="caption" className="text-xs text-red-500">
          {error}
        </Text>
      )}
    </div>
  );
}

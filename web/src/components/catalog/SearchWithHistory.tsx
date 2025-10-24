'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';

interface SearchWithHistoryProps {
  value: string;
  onChange: (query: string) => void;
  searchHistory: Array<{ id: string; query: string; createdAt: string }>;
  onClearHistory?: () => void;
  onDeleteHistoryItem?: (id: string) => void;
}

export function SearchWithHistory({
  value,
  onChange,
  searchHistory,
  onClearHistory,
  onDeleteHistoryItem,
}: SearchWithHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle search history changes - show dropdown if history becomes available
  useEffect(() => {
    if (searchHistory.length > 0 && isOpen) {
      setIsOpen(true);
    }
  }, [searchHistory.length, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(newValue.length > 0 || searchHistory.length > 0);
  };

  const handleInputFocus = () => {
    setIsOpen(inputValue.length > 0 || searchHistory.length > 0);
  };

  const handleSearch = (query: string) => {
    setInputValue(query);
    onChange(query);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(inputValue);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteHistoryItem?.(id);
  };

  const filteredHistory = searchHistory.filter(item =>
    item.query.toLowerCase().includes(inputValue.toLowerCase())
  );

  const overlayContent = isOpen ? (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] bg-black/10"
      style={{ top: 'var(--header-height, 81px)' }}
      onClick={() => setIsOpen(false)}
      aria-hidden="true"
    />
  ) : null;

  // Get the input position for dropdown positioning
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // 4px gap
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className="fixed z-[110] mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      {inputValue.length > 0 && (
        <div className="border-b border-gray-100 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left"
            onClick={() => handleSearch(inputValue)}
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Найти &quot;{inputValue}&quot;
          </Button>
        </div>
      )}

      {searchHistory.length > 0 && (
        <div className="p-3">
          <div className="mb-3">
            <Text className="text-sm text-gray-500">Вы искали</Text>
          </div>
          <div className="space-y-1">
            {filteredHistory.map(item => (
              <div
                key={item.id}
                className="group flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-50"
                onClick={() => handleSearch(item.query)}
              >
                <div className="flex flex-1 items-center">
                  <svg
                    className="mr-3 h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <Text className="truncate text-sm font-medium text-gray-900">
                    {item.query.toLowerCase()}
                  </Text>
                </div>
                {onDeleteHistoryItem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => handleDeleteHistoryItem(e, item.id)}
                    className="h-6 w-6 p-0 text-gray-400 opacity-0 transition-opacity hover:text-gray-600 group-hover:opacity-100"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {inputValue.length === 0 && searchHistory.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          <Text className="text-sm">Начните вводить для поиска</Text>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      {/* Modal-like overlay when dropdown is open */}
      {typeof document !== 'undefined' &&
        overlayContent &&
        createPortal(overlayContent, document.body)}

      {/* Search dropdown rendered as portal */}
      {typeof document !== 'undefined' &&
        dropdownContent &&
        createPortal(dropdownContent, document.body)}

      <div className="relative w-full">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Поиск товаров..."
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            fullWidth
            className="search-input !rounded-2xl !border-0 !bg-white !py-3 pr-20 !text-base !shadow-sm placeholder:!text-gray-400 focus:!border-purple-500 focus:!ring-2 focus:!ring-purple-200 focus-visible:!border-purple-500 focus-visible:!ring-2 focus-visible:!ring-purple-200"
          />
          {/* Clear button - show when there's text */}
          {inputValue && (
            <button
              type="button"
              className="absolute right-12 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md hover:bg-gray-100"
              onClick={() => {
                setInputValue('');
                onChange('');
              }}
              aria-label="Очистить поиск"
            >
              <svg
                className="h-4 w-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Search button */}
          <button
            type="button"
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md hover:bg-white/10"
            onClick={() => handleSearch(inputValue)}
            aria-label="Найти товары"
          >
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

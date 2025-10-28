'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { useAddressAutocomplete } from '@/hooks/useAddressAutocomplete';

interface AddressSuggestion {
  id: string;
  address: string;
  description?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
}

export function AddressInput({
  value,
  onChange,
  placeholder = 'Город, улица, дом, офис',
  className,
  disabled = false,
  required = false,
  error = false,
}: AddressInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const {
    suggestions,
    isLoading,
    error: fetchError,
    fetchSuggestions,
    clearSuggestions,
  } = useAddressAutocomplete();

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (!inputValue.trim() || inputValue.length < 3) {
      clearSuggestions();
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions(inputValue);
      setIsOpen(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, fetchSuggestions, clearSuggestions]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);
      setHighlightedIndex(-1);
    },
    [onChange]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      setInputValue(suggestion.address);
      onChange(suggestion.address);
      setIsOpen(false);
      clearSuggestions();
      inputRef.current?.focus();
    },
    [onChange, clearSuggestions]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) {
        if (e.key === 'ArrowDown' && suggestions.length > 0) {
          setIsOpen(true);
          setHighlightedIndex(0);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, suggestions, highlightedIndex, handleSuggestionSelect]
  );

  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  }, [suggestions.length]);

  const handleInputBlur = useCallback(() => {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedItem = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        className={clsx(
          // Base styles
          'bg-background w-full rounded-lg border px-3 py-2 text-sm shadow-none outline-none',
          'placeholder:text-muted',
          // Focus styles
          'focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:ring-offset-0',
          // Error styles
          error &&
            'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200',
          // Disabled styles
          disabled && 'cursor-not-allowed bg-gray-50 text-gray-500',
          className
        )}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={clsx(
                    'w-full px-3 py-2 text-left text-sm transition-colors',
                    'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                    index === highlightedIndex && 'bg-purple-50 text-purple-900'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-gray-900">
                        {suggestion.address}
                      </div>
                      {suggestion.description && (
                        <div className="truncate text-xs text-gray-500">
                          {suggestion.description}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error message */}
      {fetchError && (
        <div className="mt-1 text-xs text-red-600">
          Ошибка загрузки адресов. Попробуйте еще раз.
        </div>
      )}
    </div>
  );
}

export default AddressInput;

'use client';

import { useRef } from 'react';

import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';

import { useColorAutocomplete } from '@/hooks/useColorAutocomplete';
import { ColorSuggestionsList } from './ColorSuggestionsList';

interface ColorAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onClearError?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export function ColorAutocomplete({
  value,
  onChange,
  onClearError,
  disabled = false,
  error,
  required = false,
}: ColorAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const {
    suggestions,
    isOpen,
    isLoading,
    highlightedIndex,
    handleKeyDown,
    handleInputFocus,
    handleSelect,
    resetHighlight,
    closeDropdown,
  } = useColorAutocomplete(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (onClearError) {
      onClearError();
    }
    resetHighlight();
  };

  const handleSelectColor = (color: string) => {
    handleSelect(color, onChange);
    // Blur the input to prevent dropdown from reopening
    inputRef.current?.blur();
  };

  const handleKeyDownWithEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      e.preventDefault();
      handleSelectColor(suggestions[highlightedIndex]);
      return;
    }
    handleKeyDown(e);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        closeDropdown();
      }
    }, 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDownWithEnter}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Например: Черный"
          disabled={disabled}
          required={required}
          fullWidth
          className={`text-sm ${error ? 'border-red-500' : ''} ${isLoading ? 'pr-10' : ''}`}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
          </div>
        )}
      </div>
      {error && (
        <Text variant="caption" className="text-xs text-red-500">
          {error}
        </Text>
      )}

      <ColorSuggestionsList
        suggestions={suggestions}
        isOpen={isOpen}
        highlightedIndex={highlightedIndex}
        onSelect={handleSelectColor}
      />
    </div>
  );
}

'use client';

import { useRef, useEffect } from 'react';

import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';

import { useMaterialAutocomplete } from '@/hooks/useMaterialAutocomplete';
import { MaterialSuggestionsList } from './MaterialSuggestionsList';

interface MaterialAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onClearError?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export function MaterialAutocomplete({
  value,
  onChange,
  onClearError,
  disabled = false,
  error,
  required = false,
}: MaterialAutocompleteProps) {
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
    resetInitialState,
  } = useMaterialAutocomplete(value);
  const hasFocusedRef = useRef(false);
  const hasInteractedRef = useRef(false);

  // Reset state when value changes from external source (e.g., modal opens with data)
  // Only reset if user hasn't interacted yet
  useEffect(() => {
    if (!hasInteractedRef.current) {
      hasFocusedRef.current = false;
      resetInitialState();
    }
  }, [value, resetInitialState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    hasInteractedRef.current = true;
    onChange(e.target.value);
    if (onClearError) {
      onClearError();
    }
    resetHighlight();
  };

  const handleSelectMaterial = (material: string) => {
    handleSelect(material, onChange);
    // Blur the input to prevent dropdown from reopening
    inputRef.current?.blur();
  };

  const handleKeyDownWithEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      e.preventDefault();
      handleSelectMaterial(suggestions[highlightedIndex]);
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
          onFocus={e => {
            hasInteractedRef.current = true;
            if (!hasFocusedRef.current) {
              hasFocusedRef.current = true;
              // Don't open on first focus (when modal opens)
              return;
            }
            handleInputFocus();
          }}
          onBlur={handleInputBlur}
          placeholder="Введите материал..."
          disabled={disabled}
          required={required}
          fullWidth
          className={`${error ? 'border-red-500' : ''} ${isLoading ? 'pr-10' : ''}`}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
          </div>
        )}
      </div>
      {error && (
        <Text variant="caption" className="text-red-500">
          {error}
        </Text>
      )}

      <MaterialSuggestionsList
        suggestions={suggestions}
        isOpen={isOpen}
        highlightedIndex={highlightedIndex}
        onSelect={handleSelectMaterial}
      />
    </div>
  );
}

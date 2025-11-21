'use client';

import { useRef, useEffect } from 'react';

import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';

import { useColorAutocomplete } from '@/hooks/useColorAutocomplete';
import { ColorSuggestionsList } from './ColorSuggestionsList';

interface ColorAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onSelect?: (value: string) => void;
  onClearError?: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export function ColorAutocomplete({
  value,
  onChange,
  onBlur,
  onSelect,
  onClearError,
  disabled = false,
  error,
  required = false,
}: ColorAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const justSelectedRef = useRef(false);

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
  } = useColorAutocomplete(value);
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

  const handleSelectColor = (color: string) => {
    // Mark that we just selected a value to prevent onBlur from overriding it
    justSelectedRef.current = true;

    // Update the input value immediately with the full selected color
    onChange(color);

    // If onSelect callback is provided, call it with the full selected value
    // This ensures the full value is committed (for immediate updates like color changes)
    if (onSelect) {
      onSelect(color);
    }

    // Use handleSelect to properly close dropdown and reset state
    // Pass a no-op callback since we already called onChange above
    handleSelect(color, () => {});

    // Blur the input to prevent dropdown from reopening
    inputRef.current?.blur();

    // Reset the flag after a short delay to allow blur event to be ignored
    setTimeout(() => {
      justSelectedRef.current = false;
    }, 300);

    // Trigger onBlur callback when selecting a suggestion (only if onSelect wasn't provided)
    if (!onSelect && onBlur) {
      setTimeout(() => onBlur(), 100);
    }
  };

  const handleKeyDownWithEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Enter' &&
      isOpen &&
      highlightedIndex >= 0 &&
      highlightedIndex < suggestions.length
    ) {
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
        // Trigger onBlur callback after dropdown is closed
        // But skip if we just selected a value (onSelect already handled it)
        if (onBlur && !justSelectedRef.current) {
          onBlur();
        }
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
          placeholder="Например: Черный"
          disabled={disabled}
          required={required}
          fullWidth
          className={`text-sm ${error ? 'border-red-500' : ''} ${isLoading ? 'pr-10' : ''}`}
          autoComplete="off"
        />
        {isLoading && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
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

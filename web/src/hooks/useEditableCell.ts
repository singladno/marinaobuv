import { useState, useCallback } from 'react';

interface UseEditableCellProps {
  value: string | number | null;
  onSave: (value: string | number | null) => Promise<void>;
  type?: 'text' | 'number' | 'price';
  disabled?: boolean;
}

export function useEditableCell({
  value,
  onSave,
  type = 'text',
  disabled = false,
}: UseEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(String(value || ''));
  }, [disabled, value]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    const newValue =
      type === 'number' || type === 'price'
        ? editValue === ''
          ? null
          : Number(editValue)
        : editValue;

    // Only save if value actually changed
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(newValue);
      } catch (error) {
        console.error('Failed to save:', error);
        // Revert to original value on error
        setEditValue(String(value || ''));
      } finally {
        setIsSaving(false);
      }
    }

    setIsEditing(false);
  }, [isSaving, editValue, value, type, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(String(value || ''));
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  const handleBlur = useCallback(() => {
    if (isEditing) {
      handleSave();
    }
  }, [isEditing, handleSave]);

  return {
    isEditing,
    editValue,
    isSaving,
    handleEdit,
    handleSave,
    handleCancel,
    handleKeyDown,
    handleBlur,
    setEditValue,
  };
}

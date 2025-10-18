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
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );

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
      setStatus('saving');
      try {
        await onSave(newValue);
        setStatus('success');
        // Clear success status after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to save:', error);
        setStatus('error');
        // Revert to original value on error
        setEditValue(String(value || ''));
        // Clear error status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
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
    status,
    handleEdit,
    handleSave,
    handleCancel,
    handleKeyDown,
    handleBlur,
    setEditValue,
  };
}

import * as React from 'react';

interface SizeActionButtonProps {
  isSaving: boolean;
  onDelete: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  sizeRef: HTMLDivElement | null;
}

export function SizeActionButton({
  isSaving,
  onDelete,
  onMouseEnter,
  onMouseLeave,
  sizeRef,
}: SizeActionButtonProps) {
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!sizeRef) return;

    const updatePosition = () => {
      const rect = sizeRef.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.right + window.scrollX + 8,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [sizeRef]);

  if (!sizeRef) return null;

  return (
    <div
      className="fixed z-50 flex flex-col gap-1 rounded-lg border bg-white p-2 shadow-lg dark:bg-gray-800"
      style={{
        top: position.top,
        left: position.left,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={onDelete}
        disabled={isSaving}
        className="rounded bg-red-100 px-2 py-1 text-xs text-red-800 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
        type="button"
        title="Удалить размер"
      >
        {isSaving ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-red-700" />
        ) : (
          '🗑️ Удалить'
        )}
      </button>
    </div>
  );
}

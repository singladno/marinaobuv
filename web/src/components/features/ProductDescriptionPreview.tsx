'use client';

type ProductDescriptionPreviewProps = {
  value: string;
  isLoading: boolean;
  onExpand: () => void;
};

export function ProductDescriptionPreview({
  value,
  isLoading,
  onExpand,
}: ProductDescriptionPreviewProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
      <p
        className={`text-sm text-gray-700 dark:text-gray-200 ${
          value ? 'line-clamp-3' : 'italic text-gray-400 dark:text-gray-500'
        }`}
      >
        {value || 'Описание не добавлено'}
      </p>
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onExpand}
          className="cursor-pointer font-medium text-purple-600 transition-colors hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200"
        >
          Ещё
        </button>
        {isLoading && <span className="text-gray-500">Сохранение...</span>}
      </div>
    </div>
  );
}

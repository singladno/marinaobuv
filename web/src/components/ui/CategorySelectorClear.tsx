'use client';

type CategorySelectorClearProps = {
  onClear: () => void;
};

export function CategorySelectorClear({ onClear }: CategorySelectorClearProps) {
  return (
    <div className="border-b border-gray-100 px-4 py-2">
      <button
        onClick={onClear}
        className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50"
      >
        ✕ Очистить выбор
      </button>
    </div>
  );
}

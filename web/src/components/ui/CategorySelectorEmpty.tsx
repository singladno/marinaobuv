'use client';

type CategorySelectorEmptyProps = {
  searchTerm: string;
};

export function CategorySelectorEmpty({
  searchTerm,
}: CategorySelectorEmptyProps) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-6 w-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500">
        {searchTerm ? 'Категории не найдены' : 'Нет доступных категорий'}
      </p>
      {searchTerm && (
        <p className="mt-1 text-xs text-gray-400">
          Попробуйте другой поисковый запрос
        </p>
      )}
    </div>
  );
}

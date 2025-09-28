'use client';

type CategorySelectorSearchProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export function CategorySelectorSearch({
  searchTerm,
  onSearchChange,
}: CategorySelectorSearchProps) {
  return (
    <div className="border-b border-gray-100 p-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Поиск категории..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-lg border-0 bg-gray-50 pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 transform">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

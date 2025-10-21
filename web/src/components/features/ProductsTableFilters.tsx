'use client';

import React, { useState, useEffect } from 'react';

import { useCategories } from '@/hooks/useCategories';

interface ProductsTableFiltersProps {
  filters: {
    search: string;
    categoryId: string;
  };
  onFiltersChange: (filters: { search?: string; categoryId?: string }) => void;
  onReload: () => void;
  loading: boolean;
}

export function ProductsTableFilters({
  filters,
  onFiltersChange,
  onReload,
  loading,
}: ProductsTableFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const { categories } = useCategories();

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = () => {
    onFiltersChange({ search: searchValue });
  };

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({ categoryId: categoryId || '' });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onFiltersChange({ search: '', categoryId: '' });
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                placeholder="Поиск по названию, артикулу..."
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
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

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={filters.categoryId}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              aria-label="Фильтр по категории"
            >
              <option value="">Все категории</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSearchSubmit}
            disabled={loading}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Найти
          </button>
          <button
            onClick={handleClearFilters}
            disabled={loading}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Очистить
          </button>
          <button
            onClick={onReload}
            disabled={loading}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></div>
            ) : (
              'Обновить'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

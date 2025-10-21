'use client';

import React from 'react';

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className = '' }: FilterBarProps) {
  return (
    <div
      className={`border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      <div className="flex items-center space-x-4">{children}</div>
    </div>
  );
}

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchFilter({
  value,
  onChange,
  placeholder = 'Поиск...',
  className = '',
}: SearchFilterProps) {
  return (
    <div className={`flex-1 ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );
}

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  categories: Array<{ id: string; name: string }>;
  placeholder?: string;
  className?: string;
}

export function CategoryFilter({
  value,
  onChange,
  categories,
  placeholder = 'Выберите категорию',
  className = '',
}: CategoryFilterProps) {
  return (
    <div className={className}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        aria-label="Категория"
      >
        <option value="">{placeholder}</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FilterActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterActions({
  children,
  className = '',
}: FilterActionsProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>{children}</div>
  );
}

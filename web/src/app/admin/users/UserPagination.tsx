'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface UserPaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export function UserPagination({
  page,
  totalPages,
  limit,
  setPage,
  setLimit,
}: UserPaginationProps) {
  if (totalPages <= 1 && page === 1) return null;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page <= 4) {
        // Near the start: 1 2 3 4 5 ... last
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        // Near the end: 1 ... (last-4) (last-3) (last-2) (last-1) last
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle: 1 ... (page-1) page (page+1) ... last
        pages.push('ellipsis');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col gap-4 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-800">
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Показать:
        </span>
        <Select
          value={limit.toString()}
          onValueChange={value => {
            setLimit(parseInt(value));
            setPage(1); // Reset to first page when changing limit
          }}
        >
          <SelectTrigger
            className="h-9 w-20 border-gray-300 dark:border-gray-600"
            aria-label="Элементов на странице"
          >
            <SelectValue placeholder={limit.toString()}>{limit}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          на странице
        </span>
      </div>

      {/* Pagination controls */}
      <div className="mr-16 flex items-center gap-3 sm:mr-0">
        {/* Mobile: Previous/Next only */}
        <div className="flex w-full justify-between gap-2 sm:hidden">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            Предыдущая
          </Button>
          <Button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            Следующая
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Desktop: Full pagination */}
        <div className="hidden sm:mr-16 sm:flex sm:items-center sm:gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Страница{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {page}
            </span>{' '}
            из{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {totalPages}
            </span>
          </div>

          <nav className="flex items-center gap-1" aria-label="Pagination">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
              className="h-9 border-gray-300 px-3 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((pageNum, index) => {
                if (pageNum === 'ellipsis') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex h-9 w-9 items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      ...
                    </span>
                  );
                }

                const pageNumber = pageNum as number;
                const isActive = pageNumber === page;

                return (
                  <Button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    className={`h-9 min-w-[36px] px-3 font-medium transition-all ${
                      isActive
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              variant="outline"
              size="sm"
              className="h-9 border-gray-300 px-3 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}

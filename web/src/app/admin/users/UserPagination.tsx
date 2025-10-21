'use client';

import { Button } from '@/components/ui/Button';

interface UserPaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export function UserPagination({
  page,
  totalPages,
  setPage,
}: UserPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          variant="outline"
        >
          Предыдущая
        </Button>
        <Button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          variant="outline"
        >
          Следующая
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Страница <span className="font-medium">{page}</span> из{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
              className="rounded-l-md"
            >
              Предыдущая
            </Button>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              variant="outline"
              className="rounded-r-md"
            >
              Следующая
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to help with debugging in development
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="mb-3 text-3xl font-bold">Произошла ошибка</h1>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        Что-то пошло не так. Попробуйте обновить страницу или вернитесь на главную.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Повторить
        </button>
        <Link
          href="/"
          className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

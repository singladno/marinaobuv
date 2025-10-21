import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="mb-3 text-3xl font-bold">Страница не найдена</h1>
      <p className="mb-6 text-gray-700 dark:text-gray-300">
        Упс! Похоже, что такой страницы нет.
      </p>
      <Link
        href="/"
        className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        На главную
      </Link>
    </div>
  );
}

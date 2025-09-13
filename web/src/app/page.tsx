// MarinaObuv Project - Component Size Limit: 120 lines max
// Decompose large components into hooks, sub-components, and utilities
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="space-y-8 p-8 text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900 dark:text-white">
          МаринаОбувь
        </h1>
        <p className="mb-8 text-2xl text-gray-600 dark:text-gray-300">
          Hello World
        </p>

        <div className="space-y-4">
          <Link
            href="/api/health"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-blue-700 hover:shadow-xl"
          >
            Check API Health
          </Link>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              API Endpoint:{' '}
              <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700">
                /api/health
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Загрузка корзины...
        </p>
      </div>
    </div>
  );
}

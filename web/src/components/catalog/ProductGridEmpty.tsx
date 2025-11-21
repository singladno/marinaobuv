export function ProductGridEmpty() {
  return (
    <div className="py-12 text-center">
      <p className="text-lg text-gray-500">Товары не найдены</p>
      <p className="mt-2 text-sm text-gray-400">
        Попробуйте изменить параметры поиска или фильтры
      </p>
    </div>
  );
}

interface ProductDateCellProps {
  date: Date;
}

export function ProductDateCell({ date }: ProductDateCellProps) {
  return (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {new Date(date).toLocaleDateString('ru-RU')}
    </span>
  );
}

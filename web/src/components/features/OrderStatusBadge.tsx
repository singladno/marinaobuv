interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color =
    status === 'new'
      ? 'bg-gray-100 text-gray-800'
      : status === 'Наличие'
        ? 'bg-blue-100 text-blue-800'
        : status === 'Купить'
          ? 'bg-amber-100 text-amber-800'
          : status === 'Согласование'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800';
  return (
    <span className={`rounded px-2 py-0.5 text-xs ${color}`}>{status}</span>
  );
}

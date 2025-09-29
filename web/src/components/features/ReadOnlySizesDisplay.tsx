import type { Draft } from '@/types/admin';

interface ReadOnlySizesDisplayProps {
  sizes: Draft['sizes'];
}

export function ReadOnlySizesDisplay({ sizes }: ReadOnlySizesDisplayProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      <div className="flex gap-1">
        {sizes.map((x, index) => (
          <div
            key={index}
            className="flex-shrink-0 rounded border bg-white px-2 py-1 text-sm shadow-sm dark:bg-gray-800"
          >
            <div className="flex items-center gap-1">
              <span className="font-medium">{x.size}</span>
              <span className="text-gray-500">×</span>
              <span className="text-gray-600">
                {x.count || x.quantity || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

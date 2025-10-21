import type { Draft } from '@/types/admin';

interface ReadOnlySizesDisplayProps {
  sizes: Draft['sizes'];
}

export function ReadOnlySizesDisplay({ sizes }: ReadOnlySizesDisplayProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      <div className="flex gap-1">
        {sizes?.map((x, index) => (
          <div
            key={index}
            className="flex-shrink-0 rounded border bg-white px-2 py-1 text-sm shadow-sm dark:bg-gray-800"
          >
            <div className="flex items-center gap-1">
              <span className="font-medium">{x.size}</span>
              {(x.count || x.quantity || 0) > 1 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                  {x.count || x.quantity || 0}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

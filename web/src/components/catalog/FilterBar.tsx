import type { CatalogFilters } from '@/types/filters';

import { FilterActions } from './FilterActions';
import { PriceFilter } from './PriceFilter';
import { SortFilter } from './SortFilter';

type Props = {
  path?: string;
  categoryId?: string;
  filters: CatalogFilters;
  bounds: { min: number; max: number };
};

export default function FilterBar({
  path,
  categoryId,
  filters,
  bounds,
}: Props) {
  const resetHref = categoryId
    ? '/catalog'
    : `/catalog${path ? '/' + path : ''}`;

  return (
    <form
      method="GET"
      className="border-border bg-surface mb-4 rounded border p-3 text-sm"
    >
      {/* ensure page resets to 1 on apply */}
      <input type="hidden" name="page" value="1" />
      {/* keep pageSize if customized */}
      {filters.pageSize && filters.pageSize !== 24 && (
        <input type="hidden" name="pageSize" value={String(filters.pageSize)} />
      )}
      {/* preserve categoryId if present */}
      {categoryId && (
        <input type="hidden" name="categoryId" value={categoryId} />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PriceFilter
          bounds={bounds}
          priceFrom={filters.priceFrom}
          priceTo={filters.priceTo}
        />
        <SortFilter sort={filters.sort} />
        <FilterActions resetHref={resetHref} />
      </div>
    </form>
  );
}

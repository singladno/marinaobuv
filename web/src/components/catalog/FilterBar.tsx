import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { sortLabel } from '@/lib/format';
import type { CatalogFilters } from '@/types/filters';

type Props = {
  path?: string;
  filters: CatalogFilters;
  bounds: { min: number; max: number };
};

export default function FilterBar({ path, filters, bounds }: Props) {
  const resetHref = `/catalog${path ? '/' + path : ''}`;

  return (
    <form method="GET" className="mb-4 rounded border border-border bg-surface p-3 text-sm">
      {/* ensure page resets to 1 on apply */}
      <input type="hidden" name="page" value="1" />
      {/* keep pageSize if customized */}
      {filters.pageSize && filters.pageSize !== 24 && (
        <input type="hidden" name="pageSize" value={String(filters.pageSize)} />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        {/* Price */}
        <div className="flex items-end gap-2">
          <div>
            <Text as="label" className="mb-1 block text-xs text-muted">Цена от, ₽</Text>
            <Input type="number" name="priceFrom" placeholder={String(bounds.min ?? '')} defaultValue={filters.priceFrom ?? ''} className="w-28" />
          </div>
          <div>
            <Text as="label" className="mb-1 block text-xs text-muted">до</Text>
            <Input type="number" name="priceTo" placeholder={String(bounds.max ?? '')} defaultValue={filters.priceTo ?? ''} className="w-28" />
          </div>
        </div>

        {/* Sort */}
        <div>
          <Text as="label" className="mb-1 block text-xs text-muted">Сортировка</Text>
          <Select name="sort" defaultValue={filters.sort ?? 'relevance'}>
            {(['relevance', 'price-asc', 'price-desc', 'newest'] as const).map((key) => (
              <option key={key} value={key}>
                {sortLabel(key)}
              </option>
            ))}
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary">Применить</Button>
          <a href={resetHref} className="text-muted underline hover:text-foreground">Сбросить</a>
        </div>
      </div>
    </form>
  );
}

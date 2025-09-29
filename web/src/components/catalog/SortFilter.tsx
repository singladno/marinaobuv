import { Select } from '@/components/ui/Select';
import { Text } from '@/components/ui/Text';
import { sortLabel } from '@/lib/format';

interface SortFilterProps {
  sort?: string;
}

export function SortFilter({ sort }: SortFilterProps) {
  return (
    <div>
      <Text as="label" className="text-muted mb-1 block text-xs">
        Сортировка
      </Text>
      <Select name="sort" defaultValue={sort ?? 'relevance'}>
        {(['relevance', 'price-asc', 'price-desc', 'newest'] as const).map(
          key => (
            <option key={key} value={key}>
              {sortLabel(key)}
            </option>
          )
        )}
      </Select>
    </div>
  );
}

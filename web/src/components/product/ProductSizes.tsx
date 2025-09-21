import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

type Size = {
  id: string;
  size: string;
  stock?: number | null;
  perBox?: number | null;
};

function renderQty(stock?: number | null, perBox?: number | null) {
  const a = stock;
  const b = typeof perBox === 'number' ? perBox : null;
  if (a != null && b != null) return `${a} / ${b}`;
  if (a != null) return `${a}`;
  if (b != null) return `${b}`;
  return null;
}

export default function ProductSizes({ sizes }: { sizes: Size[] }) {
  if (!sizes.length) return null;
  return (
    <Card className="p-4">
      <Text variant="overline" className="mb-3">
        Таблица размеров
      </Text>
      <div className="grid grid-cols-4 gap-2 text-center text-sm sm:grid-cols-8">
        {sizes.map(s => (
          <div
            key={s.id}
            className={`border-border bg-background rounded border px-2 py-2 transition-colors ${
              s.stock === 0 ? 'bg-muted opacity-50' : 'hover:bg-muted/50'
            }`}
          >
            <div className="font-medium">{s.size}</div>
            {(s.stock != null || s.perBox != null) && (
              <div className="text-muted mt-1 text-xs">
                {renderQty(s.stock, s.perBox)}
              </div>
            )}
            {s.stock === 0 && (
              <div className="text-destructive mt-1 text-xs">Нет в наличии</div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

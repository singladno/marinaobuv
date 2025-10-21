import { Button } from '@/components/ui/Button';

interface FilterActionsProps {
  resetHref: string;
}

export function FilterActions({ resetHref }: FilterActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" variant="primary">
        Применить
      </Button>
      <a
        href={resetHref}
        className="text-muted hover:text-foreground underline"
      >
        Сбросить
      </a>
    </div>
  );
}

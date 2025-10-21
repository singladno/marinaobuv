import { Button } from '@/components/ui/Button';

interface DraftDeletionActionsProps {
  selectedCount: number;
  onBulkRestore: () => void;
  onBulkPermanentDelete: () => void;
}

export function DraftDeletionActions({
  selectedCount,
  onBulkRestore,
  onBulkPermanentDelete,
}: DraftDeletionActionsProps) {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-red-900 dark:text-red-100">
        {selectedCount} черновиков выбрано
      </span>
      <div className="flex space-x-2">
        <Button
          onClick={onBulkRestore}
          size="sm"
          variant="outline"
          className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
        >
          Восстановить
        </Button>
        <Button onClick={onBulkPermanentDelete} size="sm" variant="danger">
          Удалить навсегда
        </Button>
      </div>
    </div>
  );
}

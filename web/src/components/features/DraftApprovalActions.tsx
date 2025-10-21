import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';

interface DraftApprovalActionsProps {
  selectedCount: number;
  onApprove: () => Promise<void>;
  onConvertToCatalog: () => Promise<void>;
  isProcessing: boolean;
}

export function DraftApprovalActions({
  selectedCount,
  onApprove,
  onConvertToCatalog,
  isProcessing,
}: DraftApprovalActionsProps) {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
        {selectedCount} черновиков выбрано
      </span>
      <div className="flex space-x-2">
        <Button
          onClick={onApprove}
          disabled={isProcessing}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <>
              <Loader className="mr-2 h-4 w-4" />
              Одобрение...
            </>
          ) : (
            'Одобрить'
          )}
        </Button>
        <Button
          onClick={onConvertToCatalog}
          disabled={isProcessing}
          size="sm"
          variant="outline"
        >
          {isProcessing ? (
            <>
              <Loader className="mr-2 h-4 w-4" />
              Конвертация...
            </>
          ) : (
            'Конвертировать в каталог'
          )}
        </Button>
      </div>
    </div>
  );
}

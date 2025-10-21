import { useBulkDelete } from './useBulkDelete';
import { useBulkPermanentDelete } from './useBulkPermanentDelete';
import { useBulkRestore } from './useBulkRestore';

export function useBulkDeleteOperations() {
  const deleteOps = useBulkDelete();
  const restoreOps = useBulkRestore();
  const permanentDeleteOps = useBulkPermanentDelete();

  return {
    ...deleteOps,
    ...restoreOps,
    ...permanentDeleteOps,
  };
}

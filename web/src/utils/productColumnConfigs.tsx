import { createProductColumnDefinitions } from './productColumnDefinitions';

interface CreateProductColumnsOptions {
  onUpdateProduct: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  categories: Array<{ id: string; name: string }>;
  onToggle?: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
}

export function createProductColumns(options: CreateProductColumnsOptions) {
  return createProductColumnDefinitions(options);
}

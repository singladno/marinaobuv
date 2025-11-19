import { createProductColumnDefinitions } from './productColumnDefinitions';
import type { ProductUpdateData } from '@/types/product';

interface CreateProductColumnsOptions {
  onUpdateProduct: (id: string, data: ProductUpdateData) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  categories: Array<{ id: string; name: string; slug?: string; path?: string }>;
  onToggle?: (id: string) => void;
  onSelectAll?: (selectAll: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
  onEdit?: (productId: string) => void;
  onEditImages?: (productId: string) => void;
}

export function createProductColumns(options: CreateProductColumnsOptions) {
  return createProductColumnDefinitions({
    ...options,
    categories: options.categories as any, // align to CategoryNode shape
  });
}

# MarinaObuv Linting Status Report

## Summary

- **Total Issues**: 446 problems (205 errors, 241 warnings)
- **Auto-fixable**: 1 error, 0 warnings
- **Main Issues**: Component size limits, TypeScript `any` types, unused variables

## Critical Issues to Address

### 1. Component Size Violations (120 line limit)

**Files exceeding 120 lines:**

- `src/app/(main)/basket/page.tsx` (841 lines)
- `src/app/(main)/catalog/[[...segments]]/page.tsx` (289 lines)
- `src/app/(main)/login/page.tsx` (152 lines)
- `src/app/(main)/orders/page.tsx` (240 lines)
- `src/app/admin/products/page.tsx` (179 lines)
- `src/app/admin/users/page.tsx` (414 lines)
- `src/components/features/GruzchikAvailabilityColumns.tsx` (353 lines)
- `src/components/features/GruzchikPurchaseColumns.tsx` (353 lines)
- `src/components/features/OptimisticDraftTableColumnDefinitions.tsx` (518 lines)
- `src/components/features/ProductTableRow.tsx` (225 lines)
- `src/components/features/SizesCell.tsx` (216 lines)
- `src/components/features/OrdersTableRow.tsx` (164 lines)
- `src/components/product/ProductFilters.tsx` (239 lines)
- `src/components/product/ProductDetails.tsx` (complexity issues)
- `src/hooks/useDraftsTable.ts` (310 lines)
- `src/hooks/useGruzchikOrders.ts` (212 lines)
- `src/hooks/useProductOperations.ts` (139 lines)
- `src/hooks/useProducts.ts` (143 lines)
- `src/hooks/useSizeOperations.ts` (148 lines)
- `src/lib/catalog.ts` (277 lines)
- `src/lib/draft-approval-image-processor.ts` (176 lines)
- `src/lib/draft-processor.ts` (147 lines)
- `src/lib/openai-vision.ts` (133 lines)
- `src/lib/services/product-creation-service.ts` (303 lines)
- `src/lib/services/unified-analysis-service.ts` (160 lines)
- `src/lib/whapi.ts` (174 lines)
- `src/lib/yagpt.ts` (217 lines)
- `src/scripts/process-draft-products-old.ts` (622 lines)
- `src/scripts/fetch-recent-messages.ts` (165 lines)
- `src/scripts/process-draft-products-new.ts` (184 lines)
- `src/utils/productColumnDefinitions.tsx` (188 lines)
- `src/utils/columnConfigs.ts` (126 lines)

### 2. TypeScript Issues

**`any` type usage (205 instances):**

- API routes
- Component props
- Function parameters
- Event handlers
- Database queries

### 3. Complexity Issues

**Functions exceeding complexity limit (10):**

- `BasketPage` (32 complexity)
- `CatalogPage` (16 complexity)
- `saveWhatsAppMessage` (32 complexity)
- `processMessageGroupToDraft` (33 complexity)
- `validateDraftWithImagesOpenAI` (29 complexity)
- `createDraftProductFromAnalysis` (18 complexity)
- `validateDraftWithImages` (18 complexity)

### 4. Unused Variables/Imports

**241 warnings for unused code:**

- Unused imports
- Unused variables
- Unused function parameters
- Unused destructured values

## Recommended Action Plan

### Phase 1: Critical Component Decomposition

1. **Break down large components** (500+ lines) into smaller, focused components
2. **Extract custom hooks** for complex state logic
3. **Create utility functions** for repeated logic
4. **Split complex pages** into multiple components

### Phase 2: TypeScript Improvements

1. **Replace `any` types** with proper TypeScript interfaces
2. **Create type definitions** for API responses
3. **Add proper error handling** with typed errors
4. **Use generic types** where appropriate

### Phase 3: Code Quality

1. **Remove unused imports/variables**
2. **Simplify complex functions**
3. **Extract reusable logic**
4. **Improve error handling**

### Phase 4: Performance & Best Practices

1. **Optimize React components** with proper memoization
2. **Improve database queries**
3. **Add proper loading states**
4. **Implement proper error boundaries**

## Immediate Next Steps

1. **Start with the largest components** (basket page, catalog page)
2. **Focus on one component at a time**
3. **Extract reusable logic into hooks**
4. **Create proper TypeScript interfaces**
5. **Test each change thoroughly**

## Tools Available

- `npm run lint:fix` - Auto-fix simple issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Check TypeScript types
- `npm run lint:check` - Check all linting rules

## Component Decomposition Strategy

### For Large Components:

1. **Identify distinct sections** (header, content, footer)
2. **Extract state logic** into custom hooks
3. **Create sub-components** for repeated UI patterns
4. **Move utility functions** to separate files
5. **Split complex forms** into smaller components

### For Complex Functions:

1. **Break down into smaller functions**
2. **Extract common logic**
3. **Use early returns** to reduce nesting
4. **Create helper functions** for complex operations
5. **Add proper error handling**

This systematic approach will help maintain code quality while keeping components focused and maintainable.

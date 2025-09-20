# MarinaObuv Project Coding Rules

## 🎯 **Core Principles**

### 1. **Reusability First**

- **ALWAYS** create reusable components instead of duplicating code
- Extract common patterns into custom hooks and utilities
- Use composition over inheritance
- Create generic, configurable components that can be used across the project

### 2. **File Size Limit**

- **MAXIMUM 150 lines per file** (including imports, comments, and empty lines)
- If a file exceeds 150 lines, it MUST be refactored by:
  - Extracting custom hooks
  - Creating sub-components
  - Moving utility functions to separate files
  - Splitting complex logic into smaller, focused modules

### 3. **Consistent Code Style**

- Use Prettier for automatic formatting
- Follow ESLint rules strictly
- Use TypeScript for all new code
- Prefer arrow functions for components and hooks
- Use consistent naming conventions (camelCase for variables, PascalCase for components)

## 🏗️ **Component Architecture**

### **Component Structure**

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── FilterBar.tsx
│   │   ├── DataTable.tsx
│   │   └── ...
│   └── features/           # Feature-specific components
│       ├── DraftTable.tsx
│       ├── ProductCard.tsx
│       └── ...
├── hooks/                  # Custom React hooks
│   ├── useDrafts.ts
│   ├── useProducts.ts
│   └── ...
├── utils/                  # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── ...
└── types/                  # TypeScript definitions
    ├── draft.ts
    ├── product.ts
    └── ...
```

### **Component Guidelines**

1. **Single Responsibility**: Each component should have one clear purpose
2. **Props Interface**: Always define clear TypeScript interfaces for props
3. **Default Props**: Use default parameters instead of defaultProps
4. **Memoization**: Use React.memo for expensive components
5. **Error Boundaries**: Wrap complex components in error boundaries

## 🎣 **Custom Hooks**

### **When to Create Custom Hooks**

- Logic is used in multiple components
- Complex state management
- API calls and data fetching
- Form handling
- Local storage operations
- Event listeners

### **Hook Naming Convention**

- Always start with `use`
- Be descriptive: `useDraftSelection`, `useProductFilters`
- Group related hooks in the same file if they're small

### **Hook Structure**

```typescript
export function useCustomHook(param: string) {
  // State
  const [state, setState] = useState();

  // Effects
  useEffect(() => {
    // Effect logic
  }, [param]);

  // Callbacks
  const handleAction = useCallback(() => {
    // Action logic
  }, []);

  // Return object
  return {
    state,
    handleAction,
    // ... other values
  };
}
```

## 🛠️ **Utility Functions**

### **When to Create Utilities**

- Pure functions that transform data
- Validation logic
- Formatting functions
- Constants and configuration
- Helper functions used in multiple places

### **Utility Organization**

```typescript
// utils/formatters.ts
export function formatPrice(priceInKopecks: number): string {
  return (priceInKopecks / 100).toFixed(2);
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('ru-RU');
}

// utils/validators.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

## 📊 **Table Components**

### **Unified Table Pattern**

- Use `DataTable` for basic table functionality
- Use `UnifiedDataTable` for feature-specific tables
- Create column configurations in separate files
- Use TanStack Table for complex table features

### **Column Configuration**

```typescript
// utils/tableColumns.ts
export function createTableColumns(
  onAction: (id: string) => void
): ColumnDef<DataType>[] {
  return [
    columnHelper.accessor('field', {
      header: 'Header',
      cell: ({ getValue }) => getValue(),
    }),
    // ... more columns
  ];
}
```

## 🎨 **UI Components**

### **Button Components**

- Use `Button` for basic buttons
- Use `BulkActionButton` for bulk actions
- Use `RefreshButton` for refresh actions
- Use `ActionButtonGroup` for grouping buttons

### **Filter Components**

- Use `FilterBar` as container
- Use `SearchFilter` for text search
- Use `CategoryFilter` for category selection
- Use `FilterActions` for action buttons

### **Styling Guidelines**

- Use Tailwind CSS classes
- Follow dark mode patterns
- Use consistent spacing and colors
- Ensure accessibility (ARIA labels, keyboard navigation)

## 🔧 **API Integration**

### **Data Fetching Hooks**

```typescript
export function useApiData<T>(endpoint: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  return { data, loading, error, fetchData };
}
```

## 📝 **Code Quality Rules**

### **TypeScript**

- Use strict mode
- Define interfaces for all props and data structures
- Avoid `any` type - use proper typing
- Use generic types for reusable components

### **Error Handling**

- Always handle errors gracefully
- Use try-catch blocks for async operations
- Provide meaningful error messages
- Log errors for debugging

### **Performance**

- Use React.memo for expensive components
- Use useCallback for event handlers
- Use useMemo for expensive calculations
- Avoid unnecessary re-renders

### **Testing**

- Write unit tests for utilities
- Test custom hooks
- Test component behavior
- Use meaningful test descriptions

## 🚫 **Anti-Patterns to Avoid**

1. **Don't** create components larger than 150 lines
2. **Don't** duplicate code - extract to utilities
3. **Don't** use inline styles - use Tailwind classes
4. **Don't** ignore TypeScript errors
5. **Don't** create components without proper prop interfaces
6. **Don't** use useEffect for derived state
7. **Don't** mutate props or state directly
8. **Don't** create components that do too many things

## ✅ **Code Review Checklist**

- [ ] File is under 150 lines
- [ ] Component is reusable and configurable
- [ ] Proper TypeScript interfaces defined
- [ ] No code duplication
- [ ] Error handling implemented
- [ ] Accessibility considerations
- [ ] Performance optimizations applied
- [ ] Consistent naming conventions
- [ ] Proper imports and exports
- [ ] Documentation/comments where needed

## 🎯 **Enforcement**

These rules are **MANDATORY** and must be followed by all developers and AI agents working on this project. Any code that violates these rules will be rejected during code review.

### **AI Agent Instructions**

When working on this project, AI agents must:

1. Always check file size before creating/modifying files
2. Extract reusable components and utilities
3. Follow the established patterns and conventions
4. Create custom hooks for complex logic
5. Ensure all components are properly typed
6. Maintain consistency across the codebase
7. Refactor existing code to follow these rules when possible

Remember: **Quality over speed**. It's better to take time to create proper, reusable components than to rush and create duplicate, hard-to-maintain code.

# AI Agent Rules for MarinaObuv Project

## 🚨 **CRITICAL RULES - MUST FOLLOW**

### 1. **File Size Limit: 150 Lines Maximum**

- **EVERY** file must be under 150 lines
- If a file exceeds 150 lines, you MUST refactor it by:
  - Extracting custom hooks
  - Creating sub-components
  - Moving utilities to separate files
  - Splitting complex logic

### 2. **Reusability First**

- **NEVER** duplicate code
- **ALWAYS** create reusable components
- Extract common patterns into custom hooks and utilities
- Use composition over inheritance

### 3. **Consistent Code Style**

- Use Prettier formatting
- Follow ESLint rules
- Use TypeScript for all code
- Prefer arrow functions
- Use consistent naming conventions

## 🏗️ **Component Architecture Rules**

### **Component Structure**

```
src/
├── components/
│   ├── ui/                 # Reusable UI components (Button, FilterBar, DataTable)
│   └── features/           # Feature-specific components
├── hooks/                  # Custom React hooks
├── utils/                  # Utility functions
└── types/                  # TypeScript definitions
```

### **Component Guidelines**

1. **Single Responsibility**: One clear purpose per component
2. **Props Interface**: Always define TypeScript interfaces
3. **Default Props**: Use default parameters, not defaultProps
4. **Memoization**: Use React.memo for expensive components

## 🎣 **Custom Hooks Rules**

### **When to Create Custom Hooks**

- Logic used in multiple components
- Complex state management
- API calls and data fetching
- Form handling
- Local storage operations

### **Hook Naming**

- Always start with `use`
- Be descriptive: `useDraftSelection`, `useProductFilters`
- Group related hooks in same file if small

## 🛠️ **Utility Functions Rules**

### **When to Create Utilities**

- Pure functions that transform data
- Validation logic
- Formatting functions
- Constants and configuration
- Helper functions used in multiple places

## 📊 **Table Components Rules**

### **Unified Table Pattern**

- Use `DataTable` for basic table functionality
- Use `UnifiedDataTable` for feature-specific tables
- Create column configurations in separate files
- Use TanStack Table for complex features

## 🎨 **UI Components Rules**

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

## 🔧 **API Integration Rules**

### **Data Fetching Hooks**

- Create custom hooks for API calls
- Handle loading, error, and success states
- Use proper TypeScript typing
- Implement error handling

## 📝 **Code Quality Rules**

### **TypeScript**

- Use strict mode
- Define interfaces for all props and data structures
- Avoid `any` type
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

Before submitting any code, verify:

- [ ] File is under 150 lines
- [ ] Component is reusable and configurable
- [ ] Proper TypeScript interfaces defined
- [ ] No code duplication
- [ ] Error handling implemented
- [ ] Accessibility considerations
- [ ] Performance optimizations applied
- [ ] Consistent naming conventions
- [ ] Proper imports and exports

## 🎯 **Enforcement**

These rules are **MANDATORY** and must be followed by all AI agents working on this project. Any code that violates these rules will be rejected.

### **AI Agent Instructions**

When working on this project, you MUST:

1. Always check file size before creating/modifying files
2. Extract reusable components and utilities
3. Follow the established patterns and conventions
4. Create custom hooks for complex logic
5. Ensure all components are properly typed
6. Maintain consistency across the codebase
7. Refactor existing code to follow these rules when possible

Remember: **Quality over speed**. It's better to take time to create proper, reusable components than to rush and create duplicate, hard-to-maintain code.

## 📚 **Reference Files**

- `CODING_RULES.md` - Detailed coding guidelines
- `src/components/ui/` - Reusable UI components
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `src/types/` - TypeScript definitions

## 🔄 **Refactoring Examples**

### **Before (Bad - 200+ lines)**

```typescript
// Large component with mixed concerns
export function LargeComponent() {
  // 200+ lines of mixed logic
  return <div>...</div>;
}
```

### **After (Good - Under 150 lines)**

```typescript
// Main component
export function MainComponent() {
  const { data, loading, error } = useData();
  const { handleAction } = useActions();

  return <div>...</div>;
}

// Custom hook
export function useData() {
  // Data logic
}

// Custom hook
export function useActions() {
  // Action logic
}
```

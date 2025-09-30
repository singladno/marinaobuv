# MarinaObuv

## Project Rules

- Do not use hardcoded strings for domain values (roles, statuses, types). Always use enums exported from a single source of truth (e.g., Prisma enums or TypeScript enums in `src/types`).
- Keep React components under 120 lines. Extract hooks/components/utils as needed.

A modern Next.js web application.

## Project Structure

```
marinaobuv/
├── web/                 # Next.js web application
├── package.json         # Root package.json with project scripts
├── run.sh              # Simple script to run the web application
├── .nvmrc              # Node.js version specification
└── README.md           # This file
```

## Prerequisites

- Node.js 18+ (specified in `.nvmrc`)
- npm 8+

## Quick Start

### Option 1: Using the shell script (Recommended)

1. **Run the web application:**

   ```bash
   ./run.sh
   ```

2. **Install dependencies (if needed):**
   ```bash
   ./run.sh install
   ```

### Option 2: Using npm scripts

1. **Install dependencies:**

   ```bash
   npm run install
   ```

2. **Run the web application:**
   ```bash
   npm run dev
   ```

## Available Scripts

### Shell Script Commands (`./run.sh`)

- `./run.sh` - Run web application (default)
- `./run.sh install` - Install dependencies
- `./run.sh help` - Show help message

### NPM Scripts

- `npm run dev` - Start web development server
- `npm run build` - Build web application
- `npm run start` - Start web production server
- `npm run install` - Install dependencies
- `npm run lint` - Lint web application
- `npm run lint:fix` - Lint and fix web application
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run pre-commit` - Run pre-commit checks (lint + format)

## 🎯 CRITICAL RULE: Component Size Limit

**Components must not exceed 120 lines of code.**

### When to Decompose:

- Component exceeds 120 lines
- Multiple responsibilities in one component
- Complex state management
- Multiple useEffect hooks
- Large render methods

### Decomposition Strategies:

1. **Extract Custom Hooks** - Move state logic to `hooks/` directory
2. **Create Sub-components** - Break into smaller focused components
3. **Extract Utilities** - Move pure functions to `utils/` directory
4. **Split Files** - Separate complex logic into multiple files

### Example:

```tsx
// ❌ Bad - Large component (200+ lines)
const UserDashboard = () => {
  // 200+ lines of mixed concerns
  return <div>...</div>;
};

// ✅ Good - Decomposed component (50 lines)
const UserDashboard = () => {
  const { user, loading, error } = useUser();
  const { orders } = useOrders(user?.id);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <UserProfile user={user} />
      <OrdersList orders={orders} />
    </div>
  );
};
```

## Coding Standards

This project enforces strict coding standards:

- **Component Size**: Maximum 120 lines per component (ESLint enforced)
- **Decomposition**: Extract custom hooks and utilities for complex logic
- **Code Quality**: ESLint rules for complexity, depth, and parameters
- **Import Organization**: Automatic import sorting and grouping
- **TypeScript**: Strict type checking throughout

See [CODING_STANDARDS.md](./CODING_STANDARDS.md) and [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) for detailed guidelines.

## Format on Save

The project is configured for automatic formatting on save:

- **VS Code**: Install recommended extensions and settings are auto-configured
- **Pre-commit hooks**: Automatically format and lint before commits
- **Manual**: Use `npm run format` and `npm run lint:fix`

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

## Features

- **Homepage**: Clean MarinaObuv placeholder with health API link
- **Health API**: `/api/health` endpoint returning JSON status
- **Responsive Design**: Mobile-first Tailwind CSS styling
- **TypeScript**: Full type safety throughout
- **Code Quality**: ESLint + Prettier for consistent formatting
- **Component Size Limit**: 120-line maximum enforced by ESLint
- **Custom Hooks**: Encouraged for complex logic extraction

## Development

The web application is built with:

- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Node.js Version

The project uses Node.js version 22.19.0 (specified in `.nvmrc`). If you have `nvm` installed:

```bash
nvm use
```

## Troubleshooting

### Dependencies Issues

If you encounter dependency issues:

```bash
rm -rf web/node_modules
npm run install
```

### Port Conflicts

The web application runs on port 3000 by default. If you need to change this, modify the `dev` script in `web/package.json`.

### Permission Issues (macOS/Linux)

If the shell script is not executable:

```bash
chmod +x run.sh
```

## Contributing

1. Make sure dependencies are installed: `npm run install`
2. Run the development server: `npm run dev`
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

Private project - All rights reserved.

- Image storage (S3)
  - Create a public-read S3-compatible bucket (Yandex Cloud, Selectel, VK Cloud) or place a CDN in front of a private bucket configured for public GET.
  - Configure env in `web/.env` (see `web/.env.example`).
  - For local/dev uploads, use the presign API:
    1. POST `/api/uploads/presign` to obtain a presigned PUT URL
    2. PUT the file to S3 with the returned `uploadUrl`
    3. POST `/api/products/:id/images` to save the image record

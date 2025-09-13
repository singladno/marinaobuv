# Marina Obuv

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

## Features

- **Homepage**: Clean MarinaObuv placeholder with health API link
- **Health API**: `/api/health` endpoint returning JSON status
- **Responsive Design**: Mobile-first Tailwind CSS styling
- **TypeScript**: Full type safety throughout
- **Code Quality**: ESLint + Prettier for consistent formatting

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

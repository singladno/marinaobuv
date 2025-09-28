# MarinaObuv Local Development Setup

This guide helps you set up a local development environment that matches the production server configuration.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- npm or yarn

## Quick Start

1. **Clone and setup environment:**

   ```bash
   git clone <repository-url>
   cd marinaobuv
   ```

2. **Create environment file:**

   ```bash
   cp web/.env.example web/.env.local
   # Edit web/.env.local with your local values
   ```

3. **Start local development:**

   ```bash
   # Option 1: Use the automated script
   ./run-local.sh

   # Option 2: Manual setup
   cd web
   npm run setup:local
   ```

## Environment Configuration

### Required Environment Variables

Create `web/.env.local` with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/marinaobuv"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"

# S3 Storage (Wasabi)
S3_ENDPOINT="https://s3.eu-central-1.wasabisys.com"
S3_BUCKET="marinaobuv"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"

# CDN (optional)
CDN_BASE_URL="https://your-cdn-domain.com"

# VPN (optional)
VPN_ENABLED=false
VPN_CONFIG_PATH="/path/to/vpn/config"

# Database credentials for Docker
DB_USER="postgres"
DB_PASSWORD="password"
DB_NAME="marinaobuv"
```

## Development Scripts

### Local Development

```bash
# Start development server with Docker
npm run dev:local

# Start development server only (if DB is already running)
npm run dev

# Build for local testing
npm run build:local
```

### Docker Management

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs
```

### Database Management

```bash
# Run migrations
npm run prisma:migrate

# Reset database
npm run prisma:reset

# Seed database
npm run prisma:seed

# Generate Prisma client
npm run prisma:generate
```

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check types
npm run typecheck

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
marinaobuv/
├── web/                          # Next.js application
│   ├── src/
│   │   ├── app/                  # Next.js app directory
│   │   ├── components/           # React components
│   │   │   ├── ui/              # Basic UI components
│   │   │   └── features/        # Feature-specific components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility libraries
│   │   ├── types/               # TypeScript definitions
│   │   └── utils/               # Utility functions
│   ├── prisma/                  # Database schema and migrations
│   └── .env.local              # Local environment variables
├── docker-compose.local.yml     # Local Docker setup
├── docker-compose.prod.yml      # Production Docker setup
└── run-local.sh                 # Local development script
```

## Code Quality Rules

### Component Size Limit

- **Maximum 120 lines per component** (enforced by ESLint)
- Decompose large components into smaller ones
- Extract custom hooks for complex logic
- Create sub-components for distinct UI sections

### Linting Rules

- ESLint with strict rules
- Prettier for code formatting
- TypeScript for type safety
- Import organization
- React Hooks rules

### File Organization

- Components in `components/` directory
- Custom hooks in `hooks/` directory
- Utilities in `utils/` directory
- Types in `types/` directory

## Troubleshooting

### Common Issues

1. **Database connection issues:**

   ```bash
   # Check if database is running
   docker-compose -f docker-compose.local.yml ps

   # Restart database
   docker-compose -f docker-compose.local.yml restart db
   ```

2. **Port conflicts:**

   - Change ports in `docker-compose.local.yml` if needed
   - Update `NEXTAUTH_URL` in `.env.local`

3. **Environment variables not loading:**

   - Ensure `.env.local` exists in `web/` directory
   - Check variable names match exactly

4. **Linting errors:**

   ```bash
   # Fix auto-fixable issues
   npm run lint:fix

   # Check remaining issues
   npm run lint:check
   ```

### Development Tips

1. **Hot Reload:** The development server supports hot reload for most changes
2. **Database Changes:** Run `npm run prisma:migrate` after schema changes
3. **Component Decomposition:** Keep components under 120 lines
4. **Type Safety:** Use TypeScript for all new code
5. **Code Style:** Run `npm run format` before committing

## Production Deployment

The local setup mirrors the production environment:

- Same Docker configuration
- Same environment variables
- Same build process
- Same database setup

This ensures that what works locally will work in production.

## Support

For issues with local development:

1. Check the troubleshooting section
2. Review the logs: `npm run docker:logs`
3. Ensure all environment variables are set correctly
4. Verify Docker is running and has sufficient resources

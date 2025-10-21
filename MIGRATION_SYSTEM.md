# Migration System

## Overview

This project uses a **file-based migration system** with individual migration files in a directory. Each migration is automatically discovered and executed in order.

## How It Works

### 🔄 Automated CI/CD

- **GitHub Actions** automatically runs migrations on every push to `main`
- **Prisma migrations** handle schema changes
- **Data migrations** handle data restructuring
- **No manual intervention** required

### 📁 File Structure

```
src/scripts/migrations/
├── 001-category-hierarchy.ts
├── 002-example-future-migration.ts
├── 003-add-product-reviews.ts
└── 004-cleanup-old-data.ts
```

## Migration Files

### Naming Convention

- **Numbered prefix** - `001-`, `002-`, etc. for execution order
- **Descriptive name** - `category-hierarchy`, `add-product-reviews`
- **TypeScript files** - `.ts` extension

### Migration Structure

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function up() {
  console.log("🚀 Running migration: your-migration-name");

  try {
    // Your migration logic here
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function down() {
  console.log("🔄 Rolling back migration: your-migration-name");

  try {
    // Your rollback logic here
    console.log("✅ Rollback completed");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
```

## Commands

### Local Development

```bash
# Run all migrations (schema + data)
cd web && npm run migrate:run

# Run only Prisma migrations
cd web && npm run prisma:migrate:deploy

# Reset database
cd web && npm run prisma:reset
```

### Production

- **Automatic** via GitHub Actions on push to `main`
- **No manual commands** needed

## Adding New Migrations

### 1. Create Migration File

```bash
# Create new migration file
touch src/scripts/migrations/003-add-product-reviews.ts
```

### 2. Write Migration Logic

```typescript
export async function up() {
  console.log("🚀 Running migration: 003-add-product-reviews");

  // Add review system
  const products = await prisma.product.findMany();

  for (const product of products) {
    await prisma.productReviewSettings.create({
      data: {
        productId: product.id,
        allowReviews: true,
      },
    });
  }

  console.log(`✅ Added review settings for ${products.length} products`);
}

export async function down() {
  console.log("🔄 Rolling back migration: 003-add-product-reviews");

  // Remove review system
  await prisma.productReviewSettings.deleteMany();

  console.log("✅ Removed review settings");
}
```

### 3. Test Locally

```bash
cd web && npm run migrate:run
```

### 4. Commit and Push

```bash
git add .
git commit -m "Add product reviews migration"
git push origin main
```

## Migration Tracking

### Automatic Tracking

- **MigrationHistory table** tracks executed migrations
- **Prevents duplicate execution** of the same migration
- **Ordered execution** by file name

### Migration States

- ✅ **Executed** - Migration has been run successfully
- ⏭️ **Skipped** - Migration already executed
- 🔄 **Pending** - Migration waiting to be executed

## Benefits

### ✅ Maintainable

- **Individual files** - Easy to manage and debug
- **Clear separation** - Each migration has a single purpose
- **Version control** - Track changes to each migration

### ✅ Safe

- **Automatic tracking** - Prevents duplicate execution
- **Rollback support** - Each migration can be reversed
- **Error handling** - Stops on failures

### ✅ Extensible

- **Easy to add** - Just create new file
- **Automatic discovery** - No configuration needed
- **Ordered execution** - Numbered files ensure proper order

## Examples

### Adding Product Variants

```typescript
// 003-add-product-variants.ts
export async function up() {
  const products = await prisma.product.findMany();

  for (const product of products) {
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        name: "Default",
        price: product.pricePair,
        isDefault: true,
      },
    });
  }
}
```

### Data Cleanup

```typescript
// 004-cleanup-old-data.ts
export async function up() {
  // Remove old inactive categories
  const deleted = await prisma.category.deleteMany({
    where: {
      isActive: false,
      updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  console.log(`✅ Cleaned up ${deleted.count} old categories`);
}
```

### Environment-Specific Logic

```typescript
// 005-production-setup.ts
export async function up() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // Production-specific setup
    console.log("🔧 Setting up production environment");
  } else {
    // Development-specific setup
    console.log("🔧 Setting up development environment");
  }
}
```

## Best Practices

### ✅ Do's

- **Test locally first** - Always run `npm run migrate:run`
- **Make migrations idempotent** - Safe to run multiple times
- **Add detailed logging** - Show what's happening
- **Handle errors gracefully** - Don't leave database in bad state
- **Use descriptive names** - Clear purpose of each migration

### ❌ Don'ts

- **Don't delete data without backup** - Always deactivate first
- **Don't make breaking changes** - Use additive changes when possible
- **Don't skip testing** - Always test locally first
- **Don't ignore errors** - Handle failures properly

## Workflow for Future Changes

1. **Plan the change** - What needs to be migrated?
2. **Create migration file** - Add new file to `migrations/` directory
3. **Write migration logic** - Implement `up()` and `down()` functions
4. **Test locally** - Run `npm run migrate:run`
5. **Commit and push** - GitHub Actions handles the rest
6. **Verify in production** - Check that changes applied correctly

The migration system is now **file-based**, **maintainable**, and **automated**! 🚀

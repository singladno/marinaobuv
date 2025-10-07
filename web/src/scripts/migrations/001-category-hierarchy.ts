#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  slug: string;
  path: string;
  sort: number;
  children?: CategoryData[];
}

const newCategories: CategoryData[] = [
  {
    name: 'Обувь',
    slug: 'obuv',
    path: 'obuv',
    sort: 100,
    children: [
      {
        name: 'Мужская обувь',
        slug: 'mens',
        path: 'obuv/mens',
        sort: 100,
        children: [
          {
            name: 'Осень',
            slug: 'mens-autumn',
            path: 'obuv/mens/autumn',
            sort: 100,
          },
          {
            name: 'Зима',
            slug: 'mens-winter',
            path: 'obuv/mens/winter',
            sort: 200,
          },
          {
            name: 'Весна',
            slug: 'mens-spring',
            path: 'obuv/mens/spring',
            sort: 300,
          },
          {
            name: 'Лето',
            slug: 'mens-summer',
            path: 'obuv/mens/summer',
            sort: 400,
          },
        ],
      },
      {
        name: 'Женская обувь',
        slug: 'womens',
        path: 'obuv/womens',
        sort: 200,
        children: [
          {
            name: 'Осень',
            slug: 'womens-autumn',
            path: 'obuv/womens/autumn',
            sort: 100,
          },
          {
            name: 'Зима',
            slug: 'womens-winter',
            path: 'obuv/womens/winter',
            sort: 200,
          },
          {
            name: 'Весна',
            slug: 'womens-spring',
            path: 'obuv/womens/spring',
            sort: 300,
          },
          {
            name: 'Лето',
            slug: 'womens-summer',
            path: 'obuv/womens/summer',
            sort: 400,
          },
        ],
      },
      {
        name: 'Обувь для девочек',
        slug: 'girls',
        path: 'obuv/girls',
        sort: 300,
        children: [
          {
            name: 'Осень',
            slug: 'girls-autumn',
            path: 'obuv/girls/autumn',
            sort: 100,
          },
          {
            name: 'Зима',
            slug: 'girls-winter',
            path: 'obuv/girls/winter',
            sort: 200,
          },
          {
            name: 'Весна',
            slug: 'girls-spring',
            path: 'obuv/girls/spring',
            sort: 300,
          },
          {
            name: 'Лето',
            slug: 'girls-summer',
            path: 'obuv/girls/summer',
            sort: 400,
          },
        ],
      },
      {
        name: 'Обувь для мальчиков',
        slug: 'boys',
        path: 'obuv/boys',
        sort: 400,
        children: [
          {
            name: 'Осень',
            slug: 'boys-autumn',
            path: 'obuv/boys/autumn',
            sort: 100,
          },
          {
            name: 'Зима',
            slug: 'boys-winter',
            path: 'obuv/boys/winter',
            sort: 200,
          },
          {
            name: 'Весна',
            slug: 'boys-spring',
            path: 'obuv/boys/spring',
            sort: 300,
          },
          {
            name: 'Лето',
            slug: 'boys-summer',
            path: 'obuv/boys/summer',
            sort: 400,
          },
        ],
      },
    ],
  },
];

async function createCategory(
  categoryData: CategoryData,
  parentId?: string
): Promise<string> {
  const category = await prisma.category.upsert({
    where: { slug: categoryData.slug },
    update: {
      name: categoryData.name,
      path: categoryData.path,
      sort: categoryData.sort,
      parentId: parentId,
      isActive: true,
    },
    create: {
      name: categoryData.name,
      slug: categoryData.slug,
      path: categoryData.path,
      sort: categoryData.sort,
      parentId: parentId,
      isActive: true,
    },
  });

  console.log(
    `✅ Created/Updated category: ${categoryData.name} (${categoryData.path})`
  );

  // Create children if they exist
  if (categoryData.children) {
    for (const child of categoryData.children) {
      await createCategory(child, category.id);
    }
  }

  return category.id;
}

async function migrateProducts() {
  console.log('🔄 Migrating products to new categories...');

  // Get all products with their current categories
  const products = await prisma.product.findMany({
    include: { category: true },
  });

  console.log(`📊 Found ${products.length} products to migrate`);

  // Create mapping from old category paths to new ones
  const categoryMapping: Record<string, string> = {
    // Autumn mappings
    'autumn/mens': 'obuv/mens/autumn',
    'autumn/womens': 'obuv/womens/autumn',
    'autumn/unisex': 'obuv/mens/autumn', // Map unisex to mens autumn

    // Spring mappings
    'spring/mens': 'obuv/mens/spring',
    'spring/womens': 'obuv/womens/spring',
    'spring/unisex': 'obuv/mens/spring', // Map unisex to mens spring

    // Summer mappings
    'summer/mens': 'obuv/mens/summer',
    'summer/womens': 'obuv/womens/summer',
    'summer/unisex': 'obuv/mens/summer', // Map unisex to mens summer

    // Winter mappings
    'winter/mens': 'obuv/mens/winter',
    'winter/womens': 'obuv/womens/winter',
    'winter/unisex': 'obuv/mens/winter', // Map unisex to mens winter
  };

  let migratedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    const oldPath = product.category.path;
    const newPath = categoryMapping[oldPath];

    if (newPath) {
      // Find the new category
      const newCategory = await prisma.category.findUnique({
        where: { path: newPath },
      });

      if (newCategory) {
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: newCategory.id },
        });

        migratedCount++;
        console.log(`  ✅ Migrated: ${product.name} (${oldPath} → ${newPath})`);
      } else {
        console.log(`  ❌ New category not found: ${newPath}`);
        skippedCount++;
      }
    } else {
      console.log(`  ⚠️  No mapping found for: ${oldPath}`);
      skippedCount++;
    }
  }

  console.log(`📊 Migration results:`);
  console.log(`  - Migrated: ${migratedCount}`);
  console.log(`  - Skipped: ${skippedCount}`);
}

async function deactivateOldCategories() {
  console.log('🔄 Deactivating old categories...');

  // Deactivate all old season-based categories
  const oldCategories = await prisma.category.findMany({
    where: {
      OR: [
        { slug: 'autumn' },
        { slug: 'spring' },
        { slug: 'summer' },
        { slug: 'winter' },
        { slug: { contains: 'unisex' } },
      ],
    },
  });

  for (const category of oldCategories) {
    await prisma.category.update({
      where: { id: category.id },
      data: { isActive: false },
    });

    console.log(`  ❌ Deactivated: ${category.name} (${category.path})`);
  }

  console.log(`📊 Deactivated ${oldCategories.length} old categories`);
}

export async function up() {
  console.log('🚀 Running migration: 001-category-hierarchy');

  try {
    // Step 1: Create new category hierarchy
    console.log('📝 Creating new category hierarchy...');
    for (const category of newCategories) {
      await createCategory(category);
    }

    // Step 2: Migrate products
    console.log('\n📝 Migrating products...');
    await migrateProducts();

    // Step 3: Deactivate old categories
    console.log('\n📝 Deactivating old categories...');
    await deactivateOldCategories();

    console.log('✅ Migration 001-category-hierarchy completed successfully!');
  } catch (error) {
    console.error('❌ Migration 001-category-hierarchy failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function down() {
  console.log('🔄 Rolling back migration: 001-category-hierarchy');

  try {
    // Reactivate old categories
    await prisma.category.updateMany({
      where: {
        OR: [
          { slug: 'autumn' },
          { slug: 'spring' },
          { slug: 'summer' },
          { slug: 'winter' },
          { slug: { contains: 'unisex' } },
        ],
      },
      data: { isActive: true },
    });

    // Deactivate new categories
    await prisma.category.updateMany({
      where: {
        OR: [
          { slug: 'obuv' },
          { slug: { contains: 'mens-' } },
          { slug: { contains: 'womens-' } },
          { slug: { contains: 'girls-' } },
          { slug: { contains: 'boys-' } },
        ],
      },
      data: { isActive: false },
    });

    console.log('✅ Rollback 001-category-hierarchy completed');
  } catch (error) {
    console.error('❌ Rollback 001-category-hierarchy failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

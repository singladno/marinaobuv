import { PrismaClient } from '@prisma/client';

// import { slugify } from '../src/utils/slugify';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  slug: string;
  path: string;
  sort: number;
  children?: CategoryData[];
}

const categories: CategoryData[] = [
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
  const category = await prisma.category.create({
    data: {
      name: categoryData.name,
      slug: categoryData.slug,
      path: categoryData.path,
      sort: categoryData.sort,
      parentId: parentId,
    },
  });

  console.log(`Created category: ${categoryData.name} (${categoryData.path})`);

  // Create children if they exist
  if (categoryData.children) {
    for (const child of categoryData.children) {
      await createCategory(child, category.id);
    }
  }

  return category.id;
}

async function clearExistingCategories() {
  console.log('Clearing existing categories...');

  // Delete all categories (cascade will handle children)
  const deleted = await prisma.category.deleteMany({});
  console.log(`Deleted ${deleted.count} existing categories`);
}

async function main() {
  try {
    console.log('Starting category population...');

    // Clear existing categories
    await clearExistingCategories();

    // Create all categories
    for (const category of categories) {
      await createCategory(category);
    }

    console.log('✅ Category population completed successfully!');

    // Print summary
    const totalCategories = await prisma.category.count();
    console.log(`📊 Total categories created: ${totalCategories}`);

    // Print tree structure
    console.log('\n📁 Category tree:');
    const rootCategories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { sort: 'asc' },
    });

    function printTree(categories: any[], level = 0) {
      const indent = '  '.repeat(level);
      for (const cat of categories) {
        console.log(`${indent}${cat.name} (${cat.slug})`);
        if (cat.children && cat.children.length > 0) {
          printTree(cat.children, level + 1);
        }
      }
    }

    printTree(rootCategories);
  } catch (error) {
    console.error('❌ Error populating categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

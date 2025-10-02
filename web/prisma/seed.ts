import { PrismaClient, Gender, Season, Role } from '@prisma/client';

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
    name: 'Весна',
    slug: 'spring',
    path: 'spring',
    sort: 100,
    children: [
      {
        name: 'Мужская обувь',
        slug: 'spring-mens',
        path: 'spring/mens',
        sort: 100,
        children: [
          {
            name: 'Лоферы',
            slug: 'spring-mens-loafers',
            path: 'spring/mens/loafers',
            sort: 100,
          },
          {
            name: 'Ботинки Чукка',
            slug: 'spring-mens-chukka',
            path: 'spring/mens/chukka',
            sort: 200,
          },
          {
            name: 'Кроссовки',
            slug: 'spring-mens-sneakers',
            path: 'spring/mens/sneakers',
            sort: 300,
          },
          {
            name: 'Мокасины',
            slug: 'spring-mens-moccasins',
            path: 'spring/mens/moccasins',
            sort: 400,
          },
          {
            name: 'Оксфорды',
            slug: 'spring-mens-oxfords',
            path: 'spring/mens/oxfords',
            sort: 500,
          },
        ],
      },
      {
        name: 'Женская обувь',
        slug: 'spring-womens',
        path: 'spring/womens',
        sort: 200,
        children: [
          {
            name: 'Балетки',
            slug: 'spring-womens-flats',
            path: 'spring/womens/flats',
            sort: 100,
          },
          {
            name: 'Эспадрильи',
            slug: 'spring-womens-espadrilles',
            path: 'spring/womens/espadrilles',
            sort: 200,
          },
          {
            name: 'Мюли',
            slug: 'spring-womens-mules',
            path: 'spring/womens/mules',
            sort: 300,
          },
          {
            name: 'Туфли на каблуке',
            slug: 'spring-womens-heels',
            path: 'spring/womens/heels',
            sort: 400,
          },
          {
            name: 'Слипоны',
            slug: 'spring-womens-slip-ons',
            path: 'spring/womens/slip-ons',
            sort: 500,
          },
        ],
      },
      {
        name: 'Унисекс',
        slug: 'spring-unisex',
        path: 'spring/unisex',
        sort: 300,
        children: [
          {
            name: 'Кроссовки',
            slug: 'spring-unisex-sneakers',
            path: 'spring/unisex/sneakers',
            sort: 100,
          },
          {
            name: 'Кеды',
            slug: 'spring-unisex-canvas',
            path: 'spring/unisex/canvas',
            sort: 200,
          },
          {
            name: 'Слипоны',
            slug: 'spring-unisex-slip-ons',
            path: 'spring/unisex/slip-ons',
            sort: 300,
          },
        ],
      },
    ],
  },
  {
    name: 'Лето',
    slug: 'summer',
    path: 'summer',
    sort: 200,
    children: [
      {
        name: 'Мужская обувь',
        slug: 'summer-mens',
        path: 'summer/mens',
        sort: 100,
        children: [
          {
            name: 'Сандалии',
            slug: 'summer-mens-sandals',
            path: 'summer/mens/sandals',
            sort: 100,
          },
          {
            name: 'Вьетнамки',
            slug: 'summer-mens-flip-flops',
            path: 'summer/mens/flip-flops',
            sort: 200,
          },
          {
            name: 'Кроссовки',
            slug: 'summer-mens-sneakers',
            path: 'summer/mens/sneakers',
            sort: 300,
          },
          {
            name: 'Ботинки на шнурках',
            slug: 'summer-mens-boat-shoes',
            path: 'summer/mens/boat-shoes',
            sort: 400,
          },
          {
            name: 'Мокасины',
            slug: 'summer-mens-moccasins',
            path: 'summer/mens/moccasins',
            sort: 500,
          },
        ],
      },
      {
        name: 'Женская обувь',
        slug: 'summer-womens',
        path: 'summer/womens',
        sort: 200,
        children: [
          {
            name: 'Сандалии',
            slug: 'summer-womens-sandals',
            path: 'summer/womens/sandals',
            sort: 100,
          },
          {
            name: 'Босоножки',
            slug: 'summer-womens-strappy-sandals',
            path: 'summer/womens/strappy-sandals',
            sort: 200,
          },
          {
            name: 'Вьетнамки',
            slug: 'summer-womens-flip-flops',
            path: 'summer/womens/flip-flops',
            sort: 300,
          },
          {
            name: 'Эспадрильи',
            slug: 'summer-womens-espadrilles',
            path: 'summer/womens/espadrilles',
            sort: 400,
          },
          {
            name: 'Туфли на танкетке',
            slug: 'summer-womens-wedges',
            path: 'summer/womens/wedges',
            sort: 500,
          },
          {
            name: 'Мюли',
            slug: 'summer-womens-mules',
            path: 'summer/womens/mules',
            sort: 600,
          },
        ],
      },
      {
        name: 'Унисекс',
        slug: 'summer-unisex',
        path: 'summer/unisex',
        sort: 300,
        children: [
          {
            name: 'Вьетнамки',
            slug: 'summer-unisex-flip-flops',
            path: 'summer/unisex/flip-flops',
            sort: 100,
          },
          {
            name: 'Кроссовки',
            slug: 'summer-unisex-sneakers',
            path: 'summer/unisex/sneakers',
            sort: 200,
          },
          {
            name: 'Водные туфли',
            slug: 'summer-unisex-water-shoes',
            path: 'summer/unisex/water-shoes',
            sort: 300,
          },
        ],
      },
    ],
  },
  {
    name: 'Осень',
    slug: 'autumn',
    path: 'autumn',
    sort: 300,
    children: [
      {
        name: 'Мужская обувь',
        slug: 'autumn-mens',
        path: 'autumn/mens',
        sort: 100,
        children: [
          {
            name: 'Челси',
            slug: 'autumn-mens-chelsea',
            path: 'autumn/mens/chelsea',
            sort: 100,
          },
          {
            name: 'Дезерт-ботинки',
            slug: 'autumn-mens-desert-boots',
            path: 'autumn/mens/desert-boots',
            sort: 200,
          },
          {
            name: 'Броги',
            slug: 'autumn-mens-brogues',
            path: 'autumn/mens/brogues',
            sort: 300,
          },
          {
            name: 'Кроссовки',
            slug: 'autumn-mens-sneakers',
            path: 'autumn/mens/sneakers',
            sort: 400,
          },
          {
            name: 'Оксфорды',
            slug: 'autumn-mens-oxfords',
            path: 'autumn/mens/oxfords',
            sort: 500,
          },
          {
            name: 'Лоферы',
            slug: 'autumn-mens-loafers',
            path: 'autumn/mens/loafers',
            sort: 600,
          },
        ],
      },
      {
        name: 'Женская обувь',
        slug: 'autumn-womens',
        path: 'autumn/womens',
        sort: 200,
        children: [
          {
            name: 'Ботильоны',
            slug: 'autumn-womens-ankle-boots',
            path: 'autumn/womens/ankle-boots',
            sort: 100,
          },
          {
            name: 'Лоферы',
            slug: 'autumn-womens-loafers',
            path: 'autumn/womens/loafers',
            sort: 200,
          },
          {
            name: 'Мэри Джейн',
            slug: 'autumn-womens-mary-janes',
            path: 'autumn/womens/mary-janes',
            sort: 300,
          },
          {
            name: 'Туфли закрытые',
            slug: 'autumn-womens-closed-pumps',
            path: 'autumn/womens/closed-pumps',
            sort: 400,
          },
          {
            name: 'Кроссовки',
            slug: 'autumn-womens-sneakers',
            path: 'autumn/womens/sneakers',
            sort: 500,
          },
          {
            name: 'Мокасины',
            slug: 'autumn-womens-moccasins',
            path: 'autumn/womens/moccasins',
            sort: 600,
          },
        ],
      },
      {
        name: 'Унисекс',
        slug: 'autumn-unisex',
        path: 'autumn/unisex',
        sort: 300,
        children: [
          {
            name: 'Кроссовки высокие',
            slug: 'autumn-unisex-high-tops',
            path: 'autumn/unisex/high-tops',
            sort: 100,
          },
          {
            name: 'Треккинговые ботинки',
            slug: 'autumn-unisex-hiking-boots',
            path: 'autumn/unisex/hiking-boots',
            sort: 200,
          },
          {
            name: 'Кеды',
            slug: 'autumn-unisex-canvas',
            path: 'autumn/unisex/canvas',
            sort: 300,
          },
        ],
      },
    ],
  },
  {
    name: 'Зима',
    slug: 'winter',
    path: 'winter',
    sort: 400,
    children: [
      {
        name: 'Мужская обувь',
        slug: 'winter-mens',
        path: 'winter/mens',
        sort: 100,
        children: [
          {
            name: 'Зимние ботинки',
            slug: 'winter-mens-boots',
            path: 'winter/mens/boots',
            sort: 100,
          },
          {
            name: 'Утепленные ботинки',
            slug: 'winter-mens-insulated-boots',
            path: 'winter/mens/insulated-boots',
            sort: 200,
          },
          {
            name: 'Водонепроницаемые ботинки',
            slug: 'winter-mens-waterproof-boots',
            path: 'winter/mens/waterproof-boots',
            sort: 300,
          },
          {
            name: 'Снежные ботинки',
            slug: 'winter-mens-snow-boots',
            path: 'winter/mens/snow-boots',
            sort: 400,
          },
          {
            name: 'Кожаные ботинки',
            slug: 'winter-mens-leather-boots',
            path: 'winter/mens/leather-boots',
            sort: 500,
          },
        ],
      },
      {
        name: 'Женская обувь',
        slug: 'winter-womens',
        path: 'winter/womens',
        sort: 200,
        children: [
          {
            name: 'Сапоги до колена',
            slug: 'winter-womens-knee-boots',
            path: 'winter/womens/knee-boots',
            sort: 100,
          },
          {
            name: 'Ботильоны',
            slug: 'winter-womens-ankle-boots',
            path: 'winter/womens/ankle-boots',
            sort: 200,
          },
          {
            name: 'Сапоги с мехом',
            slug: 'winter-womens-fur-lined-boots',
            path: 'winter/womens/fur-lined-boots',
            sort: 300,
          },
          {
            name: 'Сапоги выше колена',
            slug: 'winter-womens-over-knee-boots',
            path: 'winter/womens/over-knee-boots',
            sort: 400,
          },
          {
            name: 'Зимние кроссовки',
            slug: 'winter-womens-sneakers',
            path: 'winter/womens/sneakers',
            sort: 500,
          },
          {
            name: 'Угги',
            slug: 'winter-womens-ugg-boots',
            path: 'winter/womens/ugg-boots',
            sort: 600,
          },
        ],
      },
      {
        name: 'Унисекс',
        slug: 'winter-unisex',
        path: 'winter/unisex',
        sort: 300,
        children: [
          {
            name: 'Зимние треккинговые ботинки',
            slug: 'winter-unisex-hiking-boots',
            path: 'winter/unisex/hiking-boots',
            sort: 100,
          },
          {
            name: 'Снежные ботинки',
            slug: 'winter-unisex-snow-boots',
            path: 'winter/unisex/snow-boots',
            sort: 200,
          },
          {
            name: 'Зимние кроссовки',
            slug: 'winter-unisex-sneakers',
            path: 'winter/unisex/sneakers',
            sort: 300,
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
    `Created/Updated category: ${categoryData.name} (${categoryData.path})`
  );

  // Create children if they exist
  if (categoryData.children) {
    for (const child of categoryData.children) {
      await createCategory(child, category.id);
    }
  }

  return category.id;
}

async function ensureAdmin() {
  const phone = '+79999999999';
  const name = 'Admin';
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) {
    console.warn('ADMIN_PASSWORD_HASH is not set; skipping admin user seed.');
    return;
  }
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return;
  await prisma.user.create({
    data: { phone, name, role: Role.ADMIN, passwordHash },
  });
  console.log('Admin user created:', { phone });
}

async function main() {
  await ensureAdmin();

  console.log('Starting category population...');

  // Create all categories with the comprehensive structure
  for (const category of categories) {
    await createCategory(category);
  }

  console.log('✅ Category population completed successfully!');

  // Print summary
  const totalCategories = await prisma.category.count();
  console.log(`📊 Total categories created: ${totalCategories}`);

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    images: await prisma.productImage.count(),
    sizes: await prisma.productSize.count(),
  };

  console.log('Seed complete:', counts);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

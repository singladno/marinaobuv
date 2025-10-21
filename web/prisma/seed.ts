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
            children: [
              {
                name: 'Кроссовки',
                slug: 'mens-autumn-sneakers',
                path: 'obuv/mens/autumn/sneakers',
                sort: 100,
              },
              {
                name: 'Ботинки',
                slug: 'mens-autumn-boots',
                path: 'obuv/mens/autumn/boots',
                sort: 200,
              },
              {
                name: 'Туфли',
                slug: 'mens-autumn-shoes',
                path: 'obuv/mens/autumn/shoes',
                sort: 300,
              },
              {
                name: 'Мокасины',
                slug: 'mens-autumn-moccasins',
                path: 'obuv/mens/autumn/moccasins',
                sort: 400,
              },
              {
                name: 'Лоферы',
                slug: 'mens-autumn-loafers',
                path: 'obuv/mens/autumn/loafers',
                sort: 500,
              },
              {
                name: 'Челси',
                slug: 'mens-autumn-chelsea',
                path: 'obuv/mens/autumn/chelsea',
                sort: 600,
              },
            ],
          },
          {
            name: 'Зима',
            slug: 'mens-winter',
            path: 'obuv/mens/winter',
            sort: 200,
            children: [
              {
                name: 'Зимние ботинки',
                slug: 'mens-winter-boots',
                path: 'obuv/mens/winter/boots',
                sort: 100,
              },
              {
                name: 'Угги',
                slug: 'mens-winter-ugg',
                path: 'obuv/mens/winter/ugg',
                sort: 200,
              },
              {
                name: 'Валенки',
                slug: 'mens-winter-felt-boots',
                path: 'obuv/mens/winter/felt-boots',
                sort: 300,
              },
              {
                name: 'Зимние кроссовки',
                slug: 'mens-winter-sneakers',
                path: 'obuv/mens/winter/sneakers',
                sort: 400,
              },
              {
                name: 'Термоботинки',
                slug: 'mens-winter-thermal',
                path: 'obuv/mens/winter/thermal',
                sort: 500,
              },
              {
                name: 'Ботфорты',
                slug: 'mens-winter-botforts',
                path: 'obuv/mens/winter/botforts',
                sort: 600,
              },
              {
                name: 'Дутики',
                slug: 'mens-winter-dutiki',
                path: 'obuv/mens/winter/dutiki',
                sort: 700,
              },
            ],
          },
          {
            name: 'Весна',
            slug: 'mens-spring',
            path: 'obuv/mens/spring',
            sort: 300,
            children: [
              {
                name: 'Кроссовки',
                slug: 'mens-spring-sneakers',
                path: 'obuv/mens/spring/sneakers',
                sort: 100,
              },
              {
                name: 'Кеды',
                slug: 'mens-spring-canvas',
                path: 'obuv/mens/spring/canvas',
                sort: 200,
              },
              {
                name: 'Туфли',
                slug: 'mens-spring-shoes',
                path: 'obuv/mens/spring/shoes',
                sort: 300,
              },
              {
                name: 'Мокасины',
                slug: 'mens-spring-moccasins',
                path: 'obuv/mens/spring/moccasins',
                sort: 400,
              },
              {
                name: 'Эспадрильи',
                slug: 'mens-spring-espadrilles',
                path: 'obuv/mens/spring/espadrilles',
                sort: 500,
              },
            ],
          },
          {
            name: 'Лето',
            slug: 'mens-summer',
            path: 'obuv/mens/summer',
            sort: 400,
            children: [
              {
                name: 'Сандалии',
                slug: 'mens-summer-sandals',
                path: 'obuv/mens/summer/sandals',
                sort: 100,
              },
              {
                name: 'Шлепанцы',
                slug: 'mens-summer-flip-flops',
                path: 'obuv/mens/summer/flip-flops',
                sort: 200,
              },
              {
                name: 'Кроссовки',
                slug: 'mens-summer-sneakers',
                path: 'obuv/mens/summer/sneakers',
                sort: 300,
              },
              {
                name: 'Мокасины',
                slug: 'mens-summer-moccasins',
                path: 'obuv/mens/summer/moccasins',
                sort: 400,
              },
              {
                name: 'Эспадрильи',
                slug: 'mens-summer-espadrilles',
                path: 'obuv/mens/summer/espadrilles',
                sort: 500,
              },
              {
                name: 'Ботинки',
                slug: 'mens-summer-boots',
                path: 'obuv/mens/summer/boots',
                sort: 600,
              },
            ],
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
            children: [
              {
                name: 'Ботинки',
                slug: 'womens-autumn-boots',
                path: 'obuv/womens/autumn/boots',
                sort: 100,
              },
              {
                name: 'Кроссовки',
                slug: 'womens-autumn-sneakers',
                path: 'obuv/womens/autumn/sneakers',
                sort: 200,
              },
              {
                name: 'Туфли',
                slug: 'womens-autumn-shoes',
                path: 'obuv/womens/autumn/shoes',
                sort: 300,
              },
              {
                name: 'Лоферы',
                slug: 'womens-autumn-loafers',
                path: 'obuv/womens/autumn/loafers',
                sort: 400,
              },
              {
                name: 'Челси',
                slug: 'womens-autumn-chelsea',
                path: 'obuv/womens/autumn/chelsea',
                sort: 500,
              },
              {
                name: 'Ботильоны',
                slug: 'womens-autumn-ankle-boots',
                path: 'obuv/womens/autumn/ankle-boots',
                sort: 600,
              },
            ],
          },
          {
            name: 'Зима',
            slug: 'womens-winter',
            path: 'obuv/womens/winter',
            sort: 200,
            children: [
              {
                name: 'Зимние ботинки',
                slug: 'womens-winter-boots',
                path: 'obuv/womens/winter/boots',
                sort: 100,
              },
              {
                name: 'Угги',
                slug: 'womens-winter-ugg',
                path: 'obuv/womens/winter/ugg',
                sort: 200,
              },
              {
                name: 'Валенки',
                slug: 'womens-winter-felt-boots',
                path: 'obuv/womens/winter/felt-boots',
                sort: 300,
              },
              {
                name: 'Зимние кроссовки',
                slug: 'womens-winter-sneakers',
                path: 'obuv/womens/winter/sneakers',
                sort: 400,
              },
              {
                name: 'Термоботинки',
                slug: 'womens-winter-thermal',
                path: 'obuv/womens/winter/thermal',
                sort: 500,
              },
              {
                name: 'Зимние сапоги',
                slug: 'womens-winter-knee-boots',
                path: 'obuv/womens/winter/knee-boots',
                sort: 600,
              },
              {
                name: 'Ботфорты',
                slug: 'womens-winter-botforts',
                path: 'obuv/womens/winter/botforts',
                sort: 700,
              },
              {
                name: 'Дутики',
                slug: 'womens-winter-dutiki',
                path: 'obuv/womens/winter/dutiki',
                sort: 800,
              },
            ],
          },
          {
            name: 'Весна',
            slug: 'womens-spring',
            path: 'obuv/womens/spring',
            sort: 300,
            children: [
              {
                name: 'Кроссовки',
                slug: 'womens-spring-sneakers',
                path: 'obuv/womens/spring/sneakers',
                sort: 100,
              },
              {
                name: 'Кеды',
                slug: 'womens-spring-canvas',
                path: 'obuv/womens/spring/canvas',
                sort: 200,
              },
              {
                name: 'Туфли',
                slug: 'womens-spring-shoes',
                path: 'obuv/womens/spring/shoes',
                sort: 300,
              },
              {
                name: 'Балетки',
                slug: 'womens-spring-flats',
                path: 'obuv/womens/spring/flats',
                sort: 400,
              },
              {
                name: 'Эспадрильи',
                slug: 'womens-spring-espadrilles',
                path: 'obuv/womens/spring/espadrilles',
                sort: 500,
              },
              {
                name: 'Мокасины',
                slug: 'womens-spring-moccasins',
                path: 'obuv/womens/spring/moccasins',
                sort: 600,
              },
            ],
          },
          {
            name: 'Лето',
            slug: 'womens-summer',
            path: 'obuv/womens/summer',
            sort: 400,
            children: [
              {
                name: 'Сандалии',
                slug: 'womens-summer-sandals',
                path: 'obuv/womens/summer/sandals',
                sort: 100,
              },
              {
                name: 'Шлепанцы',
                slug: 'womens-summer-flip-flops',
                path: 'obuv/womens/summer/flip-flops',
                sort: 200,
              },
              {
                name: 'Кроссовки',
                slug: 'womens-summer-sneakers',
                path: 'obuv/womens/summer/sneakers',
                sort: 300,
              },
              {
                name: 'Балетки',
                slug: 'womens-summer-flats',
                path: 'obuv/womens/summer/flats',
                sort: 400,
              },
              {
                name: 'Эспадрильи',
                slug: 'womens-summer-espadrilles',
                path: 'obuv/womens/summer/espadrilles',
                sort: 500,
              },
              {
                name: 'Мюли',
                slug: 'womens-summer-mules',
                path: 'obuv/womens/summer/mules',
                sort: 600,
              },
              {
                name: 'Босоножки',
                slug: 'womens-summer-strappy',
                path: 'obuv/womens/summer/strappy',
                sort: 700,
              },
            ],
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
            children: [
              {
                name: 'Кроссовки',
                slug: 'girls-autumn-sneakers',
                path: 'obuv/girls/autumn/sneakers',
                sort: 100,
              },
              {
                name: 'Ботинки',
                slug: 'girls-autumn-boots',
                path: 'obuv/girls/autumn/boots',
                sort: 200,
              },
              {
                name: 'Туфли',
                slug: 'girls-autumn-shoes',
                path: 'obuv/girls/autumn/shoes',
                sort: 300,
              },
              {
                name: 'Мокасины',
                slug: 'girls-autumn-moccasins',
                path: 'obuv/girls/autumn/moccasins',
                sort: 400,
              },
              {
                name: 'Балетки',
                slug: 'girls-autumn-flats',
                path: 'obuv/girls/autumn/flats',
                sort: 500,
              },
            ],
          },
          {
            name: 'Зима',
            slug: 'girls-winter',
            path: 'obuv/girls/winter',
            sort: 200,
            children: [
              {
                name: 'Зимние ботинки',
                slug: 'girls-winter-boots',
                path: 'obuv/girls/winter/boots',
                sort: 100,
              },
              {
                name: 'Угги',
                slug: 'girls-winter-ugg',
                path: 'obuv/girls/winter/ugg',
                sort: 200,
              },
              {
                name: 'Валенки',
                slug: 'girls-winter-felt-boots',
                path: 'obuv/girls/winter/felt-boots',
                sort: 300,
              },
              {
                name: 'Зимние кроссовки',
                slug: 'girls-winter-sneakers',
                path: 'obuv/girls/winter/sneakers',
                sort: 400,
              },
              {
                name: 'Термоботинки',
                slug: 'girls-winter-thermal',
                path: 'obuv/girls/winter/thermal',
                sort: 500,
              },
              {
                name: 'Ботфорты',
                slug: 'girls-winter-botforts',
                path: 'obuv/girls/winter/botforts',
                sort: 600,
              },
              {
                name: 'Дутики',
                slug: 'girls-winter-dutiki',
                path: 'obuv/girls/winter/dutiki',
                sort: 700,
              },
            ],
          },
          {
            name: 'Весна',
            slug: 'girls-spring',
            path: 'obuv/girls/spring',
            sort: 300,
            children: [
              {
                name: 'Кроссовки',
                slug: 'girls-spring-sneakers',
                path: 'obuv/girls/spring/sneakers',
                sort: 100,
              },
              {
                name: 'Кеды',
                slug: 'girls-spring-canvas',
                path: 'obuv/girls/spring/canvas',
                sort: 200,
              },
              {
                name: 'Туфли',
                slug: 'girls-spring-shoes',
                path: 'obuv/girls/spring/shoes',
                sort: 300,
              },
              {
                name: 'Балетки',
                slug: 'girls-spring-flats',
                path: 'obuv/girls/spring/flats',
                sort: 400,
              },
              {
                name: 'Мокасины',
                slug: 'girls-spring-moccasins',
                path: 'obuv/girls/spring/moccasins',
                sort: 500,
              },
            ],
          },
          {
            name: 'Лето',
            slug: 'girls-summer',
            path: 'obuv/girls/summer',
            sort: 400,
            children: [
              {
                name: 'Сандалии',
                slug: 'girls-summer-sandals',
                path: 'obuv/girls/summer/sandals',
                sort: 100,
              },
              {
                name: 'Шлепанцы',
                slug: 'girls-summer-flip-flops',
                path: 'obuv/girls/summer/flip-flops',
                sort: 200,
              },
              {
                name: 'Кроссовки',
                slug: 'girls-summer-sneakers',
                path: 'obuv/girls/summer/sneakers',
                sort: 300,
              },
              {
                name: 'Балетки',
                slug: 'girls-summer-flats',
                path: 'obuv/girls/summer/flats',
                sort: 400,
              },
              {
                name: 'Эспадрильи',
                slug: 'girls-summer-espadrilles',
                path: 'obuv/girls/summer/espadrilles',
                sort: 500,
              },
              {
                name: 'Мюли',
                slug: 'girls-summer-mules',
                path: 'obuv/girls/summer/mules',
                sort: 600,
              },
            ],
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
            children: [
              {
                name: 'Кроссовки',
                slug: 'boys-autumn-sneakers',
                path: 'obuv/boys/autumn/sneakers',
                sort: 100,
              },
              {
                name: 'Ботинки',
                slug: 'boys-autumn-boots',
                path: 'obuv/boys/autumn/boots',
                sort: 200,
              },
              {
                name: 'Туфли',
                slug: 'boys-autumn-shoes',
                path: 'obuv/boys/autumn/shoes',
                sort: 300,
              },
              {
                name: 'Мокасины',
                slug: 'boys-autumn-moccasins',
                path: 'obuv/boys/autumn/moccasins',
                sort: 400,
              },
              {
                name: 'Лоферы',
                slug: 'boys-autumn-loafers',
                path: 'obuv/boys/autumn/loafers',
                sort: 500,
              },
            ],
          },
          {
            name: 'Зима',
            slug: 'boys-winter',
            path: 'obuv/boys/winter',
            sort: 200,
            children: [
              {
                name: 'Зимние ботинки',
                slug: 'boys-winter-boots',
                path: 'obuv/boys/winter/boots',
                sort: 100,
              },
              {
                name: 'Угги',
                slug: 'boys-winter-ugg',
                path: 'obuv/boys/winter/ugg',
                sort: 200,
              },
              {
                name: 'Валенки',
                slug: 'boys-winter-felt-boots',
                path: 'obuv/boys/winter/felt-boots',
                sort: 300,
              },
              {
                name: 'Зимние кроссовки',
                slug: 'boys-winter-sneakers',
                path: 'obuv/boys/winter/sneakers',
                sort: 400,
              },
              {
                name: 'Термоботинки',
                slug: 'boys-winter-thermal',
                path: 'obuv/boys/winter/thermal',
                sort: 500,
              },
              {
                name: 'Ботфорты',
                slug: 'boys-winter-botforts',
                path: 'obuv/boys/winter/botforts',
                sort: 600,
              },
              {
                name: 'Дутики',
                slug: 'boys-winter-dutiki',
                path: 'obuv/boys/winter/dutiki',
                sort: 700,
              },
            ],
          },
          {
            name: 'Весна',
            slug: 'boys-spring',
            path: 'obuv/boys/spring',
            sort: 300,
            children: [
              {
                name: 'Кроссовки',
                slug: 'boys-spring-sneakers',
                path: 'obuv/boys/spring/sneakers',
                sort: 100,
              },
              {
                name: 'Кеды',
                slug: 'boys-spring-canvas',
                path: 'obuv/boys/spring/canvas',
                sort: 200,
              },
              {
                name: 'Туфли',
                slug: 'boys-spring-shoes',
                path: 'obuv/boys/spring/shoes',
                sort: 300,
              },
              {
                name: 'Мокасины',
                slug: 'boys-spring-moccasins',
                path: 'obuv/boys/spring/moccasins',
                sort: 400,
              },
              {
                name: 'Эспадрильи',
                slug: 'boys-spring-espadrilles',
                path: 'obuv/boys/spring/espadrilles',
                sort: 500,
              },
            ],
          },
          {
            name: 'Лето',
            slug: 'boys-summer',
            path: 'obuv/boys/summer',
            sort: 400,
            children: [
              {
                name: 'Сандалии',
                slug: 'boys-summer-sandals',
                path: 'obuv/boys/summer/sandals',
                sort: 100,
              },
              {
                name: 'Шлепанцы',
                slug: 'boys-summer-flip-flops',
                path: 'obuv/boys/summer/flip-flops',
                sort: 200,
              },
              {
                name: 'Кроссовки',
                slug: 'boys-summer-sneakers',
                path: 'obuv/boys/summer/sneakers',
                sort: 300,
              },
              {
                name: 'Мокасины',
                slug: 'boys-summer-moccasins',
                path: 'obuv/boys/summer/moccasins',
                sort: 400,
              },
              {
                name: 'Эспадрильи',
                slug: 'boys-summer-espadrilles',
                path: 'obuv/boys/summer/espadrilles',
                sort: 500,
              },
              {
                name: 'Ботинки',
                slug: 'boys-summer-boots',
                path: 'obuv/boys/summer/boots',
                sort: 600,
              },
            ],
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

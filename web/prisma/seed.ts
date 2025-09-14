import { PrismaClient, Gender, Season } from "@prisma/client";

const prisma = new PrismaClient();

type CatInput = { name: string; slug: string; parentSlug?: string };

async function upsertCategory({ name, slug, parentSlug }: CatInput) {
  const parent = parentSlug
    ? await prisma.category.findUnique({ where: { slug: parentSlug } })
    : null;
  const path = parent ? `${parent.path}/${slug}` : `obuv/${slug}`;
  return prisma.category.upsert({
    where: { slug },
    update: { name, path, parentId: parent ? parent.id : null, isActive: true },
    create: {
      name,
      slug,
      path,
      parentId: parent ? parent.id : null,
      isActive: true,
    },
  });
}

async function main() {
  // Seasons
  const seasons: CatInput[] = [
    { name: "Весна", slug: "vesna" },
    { name: "Лето", slug: "leto" },
    { name: "Осень", slug: "osen" },
    { name: "Зима", slug: "zima" },
  ];

  for (const s of seasons) {
    await upsertCategory(s);
  }

  // Leaf categories, unique slugs distributed across seasons
  const leaves: CatInput[] = [
    // Весна
    { name: "Мокасины/Лоферы", slug: "mokasiny-lofery", parentSlug: "vesna" },
    { name: "Балетки", slug: "baletki", parentSlug: "vesna" },
    { name: "Сандалии", slug: "sandalii", parentSlug: "vesna" },
    // Лето
    { name: "Босоножки", slug: "bosonozhki", parentSlug: "leto" },
    { name: "Шлепанцы", slug: "shlepancy", parentSlug: "leto" },
    { name: "Домашние тапочки", slug: "domashnie-tapochki", parentSlug: "leto" },
    // Осень
    { name: "Кроссовки", slug: "krossovki", parentSlug: "osen" },
    { name: "Ботинки", slug: "botinki", parentSlug: "osen" },
    { name: "Кеды", slug: "kedy", parentSlug: "osen" },
    // Зима
    { name: "Резиновые сапоги", slug: "rezinovye-sapogi", parentSlug: "zima" },
    { name: "Туфли", slug: "tufli", parentSlug: "zima" },
  ];

  for (const c of leaves) {
    await upsertCategory(c);
  }

  // Demo product under Осень/Кроссовки
  const demo = {
    slug: "zimnie-zhenskie-krossovki-745646",
    name: "Зимние женские кроссовки",
    article: "745646",
    pricePair: 85000,
    currency: "RUB",
    packPairs: 8,
    priceBox: 680000,
    material: "искусственные материалы",
    gender: Gender.FEMALE,
    season: Season.WINTER,
    description: "Тёплые кроссовки для зимы. Удобная посадка и лёгкий уход.",
    sizes: [
      { size: "36", perBox: 1 },
      { size: "37", perBox: 1 },
      { size: "38", perBox: 2 },
      { size: "39", perBox: 2 },
      { size: "40", perBox: 1 },
      { size: "41", perBox: 1 },
    ],
    images: [
      { url: "/images/demo/1.jpg", alt: "Вид спереди", sort: 0, isPrimary: true },
      { url: "/images/demo/2.jpg", alt: "Вид сбоку", sort: 1, isPrimary: false },
    ],
  };

  const krossovki = await prisma.category.findUnique({ where: { slug: "krossovki" } });
  if (!krossovki) throw new Error("Category 'krossovki' not found");

  const product = await prisma.product.upsert({
    where: { slug: demo.slug },
    update: {
      name: demo.name,
      article: demo.article,
      categoryId: krossovki.id,
      pricePair: demo.pricePair,
      currency: demo.currency,
      packPairs: demo.packPairs,
      priceBox: demo.priceBox,
      material: demo.material,
      gender: demo.gender,
      season: demo.season,
      description: demo.description,
      availabilityCheckedAt: new Date(),
    },
    create: {
      slug: demo.slug,
      name: demo.name,
      article: demo.article,
      categoryId: krossovki.id,
      pricePair: demo.pricePair,
      currency: demo.currency,
      packPairs: demo.packPairs,
      priceBox: demo.priceBox,
      material: demo.material,
      gender: demo.gender,
      season: demo.season,
      description: demo.description,
      availabilityCheckedAt: new Date(),
    },
  });

  // Reset sizes and images to avoid duplicates and keep seed idempotent
  await prisma.productSize.deleteMany({ where: { productId: product.id } });
  await prisma.productImage.deleteMany({ where: { productId: product.id } });

  await prisma.productSize.createMany({
    data: demo.sizes.map((s) => ({ productId: product.id, size: s.size, perBox: s.perBox })),
    skipDuplicates: true,
  });

  for (const [i, img] of demo.images.entries()) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: img.url,
        alt: img.alt,
        sort: img.sort ?? i,
        isPrimary: !!img.isPrimary,
      },
    });
  }

  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    images: await prisma.productImage.count(),
    sizes: await prisma.productSize.count(),
  };

  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

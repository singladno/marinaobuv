import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");

  let where: any = {};
  if (categorySlug) {
    const cat = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: { children: { select: { id: true } } },
    });

    if (!cat) {
      return NextResponse.json({ ok: true, items: [], total: 0 });
    }

    if (cat.parentId === null && cat.children.length > 0) {
      // Season: include products from child categories
      where.categoryId = { in: cat.children.map((c) => c.id) };
    } else {
      // Leaf category
      where.categoryId = cat.id;
    }
  }

  const [itemsRaw, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        pricePair: true,
        currency: true,
        season: true,
        images: {
          where: { isPrimary: true },
          orderBy: [{ isPrimary: "desc" }, { sort: "asc" }],
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const items = itemsRaw.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    pricePair: p.pricePair,
    currency: p.currency,
    image: p.images[0]?.url ?? null,
    badges: p.season ? [p.season] : [],
  }));

  return NextResponse.json({ ok: true, items, total });
}

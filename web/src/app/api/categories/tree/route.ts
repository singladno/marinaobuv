import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  const roots = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sort: "asc" },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sort: "asc" },
        select: { id: true, name: true, slug: true, path: true },
      },
    },
  });

  const items = roots.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    path: r.path,
    children: r.children.map((c) => ({ id: c.id, name: c.name, slug: c.slug, path: c.path })),
  }));

  return NextResponse.json({ ok: true, items });
}

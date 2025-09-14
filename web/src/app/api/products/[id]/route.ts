import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Here `id` is actually the slug segment value
  const product = await prisma.product.findUnique({
    where: { slug: id },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sort: "asc" }] },
      sizes: { orderBy: { size: "asc" } },
      category: { select: { id: true, name: true, slug: true, path: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: product });
}

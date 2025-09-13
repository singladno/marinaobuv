import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;

  const product = await prisma.product.findUnique({
    where: { slug },
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


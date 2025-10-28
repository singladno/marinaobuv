import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ProductDetails from '@/components/product/ProductDetails';
import ProductGalleryWithColors from '@/components/product/ProductGalleryWithColors';
import ProductReviews from '@/components/product/ProductReviews';
import { Button } from '@/components/ui/Button';
import { prisma } from '@/lib/server/db';
import { buildCategoryPath } from '@/lib/catalog-utils';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const awaited = await params;
  const product = await prisma.product.findUnique({
    where: { slug: awaited.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      article: true,
      pricePair: true,
      description: true,
      material: true,
      gender: true,
      season: true,
      availabilityCheckedAt: true,
      sizes: true,
      sourceMessageIds: true,
      isActive: true,
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
      },
      category: true,
    },
  });
  if (!product) return notFound();
  const images: { url: string; alt?: string; color?: string | null }[] = product
    .images.length
    ? product.images.map(i => ({
        url: i.url,
        alt: i.alt ?? undefined,
        color: i.color,
      }))
    : [{ url: '/images/demo/1.jpg' }];

  return (
    <div className="bg-background min-h-screen">
      {/* Breadcrumb & Back Button */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Link>
            </Button>
            <nav className="text-muted-foreground text-sm">
              <Link
                href="/"
                className="text-muted-foreground/80 hover:text-foreground transition-colors"
              >
                Каталог
              </Link>
              <span className="text-muted-foreground/50 mx-1">/</span>
              {product.category?.name ? (
                <Link
                  href={`/catalog/${buildCategoryPath(product.category)}`}
                  className="text-muted-foreground/80 hover:text-foreground transition-colors"
                >
                  {product.category.name}
                </Link>
              ) : (
                <span>Обувь</span>
              )}
              <span className="text-muted-foreground/50 mx-1">/</span>
              <span aria-current="page" className="cursor-default select-none">
                {product.name}
              </span>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Image */}
          <div>
            <ProductGalleryWithColors
              images={images}
              productName={product.name}
              productId={product.id}
              sourceMessageIds={
                Array.isArray(product.sourceMessageIds)
                  ? (product.sourceMessageIds as string[])
                  : null
              }
              isActive={product.isActive}
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <ProductDetails
              productId={product.id}
              slug={product.slug}
              name={product.name}
              article={product.article}
              pricePair={Number(product.pricePair)}
              description={product.description}
              material={product.material}
              gender={product.gender}
              season={product.season}
              availabilityCheckedAt={product.availabilityCheckedAt ?? undefined}
              sizes={
                Array.isArray(product.sizes)
                  ? (product.sizes as Array<{ size: string; count: number }>)
                  : []
              }
              sourceMessageIds={
                Array.isArray(product.sourceMessageIds)
                  ? (product.sourceMessageIds as string[])
                  : null
              }
              imageUrl={images[0]?.url}
              isActive={product.isActive}
            />
          </div>
        </div>
      </div>

      {/* Reviews Section - Full Width */}
      <div className="container mx-auto px-4 py-8">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}

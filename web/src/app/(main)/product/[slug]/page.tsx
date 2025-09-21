import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import ProductDetails from '@/components/product/ProductDetails';
import ProductGallery from '@/components/product/ProductGallery';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { prisma } from '@/lib/server/db';

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const awaited = await Promise.resolve(params);
  const product = await prisma.product.findUnique({
    where: { slug: awaited.slug },
    include: {
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sort: 'asc' }],
      },
      sizes: true,
      category: true,
    },
  });
  if (!product) return notFound();
  const images: { url: string }[] = product.images.length
    ? product.images.map(i => ({ url: i.url }))
    : [{ url: '/images/demo/1.jpg' }];

  return (
    <div className="bg-background min-h-screen">
      {/* Breadcrumb & Back Button */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/catalog">
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Link>
            </Button>
            <span className="text-muted-foreground text-sm">
              Каталог / {product.category?.name || 'Обувь'} / {product.name}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Product Image */}
          <div>
            <ProductGallery images={images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <ProductDetails
              name={product.name}
              article={product.article}
              pricePair={product.pricePair}
              description={product.description}
              material={product.material}
              gender={product.gender}
              season={product.season}
              packPairs={product.packPairs}
              priceBox={product.priceBox}
              availabilityCheckedAt={product.availabilityCheckedAt ?? undefined}
              sizes={product.sizes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

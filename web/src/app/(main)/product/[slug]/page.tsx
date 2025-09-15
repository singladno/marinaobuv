import { notFound } from 'next/navigation';

import ProductDetails from '@/components/product/ProductDetails';
import ProductGallery from '@/components/product/ProductGallery';
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
    },
  });
  if (!product) return notFound();
  const images: { url: string }[] = product.images.length
    ? product.images.map(i => ({ url: i.url }))
    : [{ url: '/images/demo/1.jpg' }];
  // Keep first computed for potential preloading logic

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <div className="md:col-span-6">
        <ProductGallery images={images} alt={product.name} />
      </div>

      <div className="md:col-span-6">
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
  );
}

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/server/db';

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  });
  if (!product) return notFound();
  return <div className="p-4">{product.name}</div>;
}

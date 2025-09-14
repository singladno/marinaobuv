import Image from 'next/image';
import Link from 'next/link';

import { Text } from '@/components/ui/Text';
import { rub } from '@/lib/format';

type Props = {
  slug: string;
  name: string;
  pricePair: number;
  currency: string;
  imageUrl: string | null;
};

export default function ProductCard({ slug, name, pricePair, imageUrl }: Props) {
  const img = imageUrl ?? '/images/demo/1.jpg';
  return (
    <Link
      href={`/product/${slug}`}
      className="group block overflow-hidden rounded border border-border bg-surface shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-background">
        <Image
          src={img}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-3">
        <Text variant="body" className="line-clamp-2 min-h-[3rem]">{name}</Text>
        <Text className="mt-2 font-semibold">{rub(pricePair)}</Text>
      </div>
    </Link>
  );
}

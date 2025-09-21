import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { rub } from '@/lib/format';

type Props = {
  slug: string;
  name: string;
  pricePair: number;
  currency: string;
  imageUrl: string | null;
  category?: string;
  showCategory?: boolean;
};

export default function ProductCard({
  slug,
  name,
  pricePair,
  imageUrl,
  category,
  showCategory = false,
}: Props) {
  // Use the actual product image or show a placeholder
  const hasImage = imageUrl && imageUrl.trim() !== '';

  return (
    <div className="border-border bg-card group relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/product/${slug}`} className="block">
        {/* Image Container */}
        <div className="bg-muted relative aspect-square w-full overflow-hidden">
          {hasImage ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <div className="text-center text-gray-400">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm">Нет фото</p>
              </div>
            </div>
          )}

          {/* Category Badge */}
          {showCategory && category && (
            <Badge
              variant="secondary"
              className="bg-background/90 absolute left-3 top-3 shadow-sm backdrop-blur-sm"
            >
              {category}
            </Badge>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="space-y-3">
            <Text
              variant="body"
              className="text-foreground group-hover:text-primary line-clamp-2 min-h-[2.5rem] font-medium leading-tight transition-colors duration-200"
            >
              {name}
            </Text>

            <div className="flex items-center justify-between">
              <Text className="text-foreground text-xl font-bold">
                {rub(pricePair)}
              </Text>

              {/* Add to Cart Button */}
              <div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 shadow-sm transition-colors hover:bg-black hover:text-white">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="8" cy="21" r="1"></circle>
                    <circle cx="19" cy="21" r="1"></circle>
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

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
  const img = imageUrl ?? '/images/demo/1.jpg';

  return (
    <div className="border-border bg-card group relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/product/${slug}`} className="block">
        {/* Image Container */}
        <div className="bg-muted relative aspect-square w-full overflow-hidden">
          <Image
            src={img}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            priority={false}
          />

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

              {/* Quick Action Button */}
              <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full shadow-sm">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

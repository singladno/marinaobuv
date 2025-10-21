import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export function EmptyCart() {
  return (
    <div className="text-center">
      <p className="mb-4 text-lg text-gray-600 dark:text-gray-300">
        Ваша корзина пуста.
      </p>
      <Link href="/">
        <Button>Перейти в каталог</Button>
      </Link>
    </div>
  );
}

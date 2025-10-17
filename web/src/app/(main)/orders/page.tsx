'use client';

import Link from 'next/link';

import { OrderCard } from '@/components/orders/OrderCard';
import { OrdersLoginPrompt } from '@/components/orders/OrdersLoginPrompt';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Text } from '@/components/ui/Text';
import { useOrdersPage } from '@/hooks/useOrdersPage';

export default function OrdersPage() {
  const {
    orders,
    loading,
    error,
    isAuthenticated,
    getStatusBadgeVariant,
    getStatusText,
    formatDate,
    formatPrice,
  } = useOrdersPage();

  // Show login prompt if user is not authenticated
  if (!isAuthenticated && !loading) {
    return <OrdersLoginPrompt />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Text variant="h2" className="mb-4">
            Ошибка загрузки заказов
          </Text>
          <Text className="text-muted-foreground mb-4">{error}</Text>
          <Button onClick={() => window.location.reload()}>
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Text variant="h1" as="h1" className="mb-2 text-3xl font-bold">
            Мои заказы
          </Text>
          <Text className="text-muted-foreground">
            Здесь вы можете просмотреть все ваши заказы
          </Text>
        </div>

        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <Text variant="h3" className="mb-4">
              У вас пока нет заказов
            </Text>
            <Text className="text-muted-foreground mb-6">
              Начните покупки в нашем каталоге
            </Text>
            <Button asChild>
              <Link href="/">Перейти в каталог</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

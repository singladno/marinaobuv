'use client';

import { useEffect, useState } from 'react';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import Link from 'next/link';
import { useNotifications } from '@/components/ui/NotificationProvider';

interface OrderItem {
  id: string;
  slug: string;
  name: string;
  article: string | null;
  priceBox: number;
  qty: number;
  product: {
    id: string;
    slug: string;
    name: string;
    images: Array<{
      id: string;
      url: string;
      alt: string | null;
    }>;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  fullName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  transportName: string | null;
  subtotal: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        addNotification({
          type: 'error',
          title: 'Ошибка загрузки заказов',
          message: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [addNotification]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'shipped':
        return 'outline';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'Новый';
      case 'processing':
        return 'В обработке';
      case 'shipped':
        return 'Отправлен';
      case 'delivered':
        return 'Доставлен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

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
              <Link href="/catalog">Перейти в каталог</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <Card key={order.id} className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <Text variant="h3" className="mb-1">
                      Заказ #{order.orderNumber}
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      {formatDate(order.createdAt)}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                    <Text className="text-lg font-semibold">
                      {formatPrice(order.total)}
                    </Text>
                  </div>
                </div>

                {order.transportName && (
                  <div className="mb-4">
                    <Text className="text-muted-foreground text-sm">
                      Транспортная компания: {order.transportName}
                    </Text>
                  </div>
                )}

                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      {item.product.images[0] && (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.images[0].alt || item.product.name}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <Link
                          href={`/product/${item.slug}`}
                          className="hover:underline"
                        >
                          <Text className="font-medium">{item.name}</Text>
                        </Link>
                        {item.article && (
                          <Text className="text-muted-foreground text-sm">
                            Артикул: {item.article}
                          </Text>
                        )}
                        <Text className="text-muted-foreground text-sm">
                          Количество: {item.qty}
                        </Text>
                      </div>
                      <Text className="font-medium">
                        {formatPrice(item.priceBox * item.qty)}
                      </Text>
                    </div>
                  ))}
                </div>

                {order.address && (
                  <div className="mt-4 border-t pt-4">
                    <Text className="text-muted-foreground text-sm">
                      Адрес доставки: {order.address}
                    </Text>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

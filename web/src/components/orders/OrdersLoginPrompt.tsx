'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShoppingBagIcon, UserIcon } from '@heroicons/react/24/outline';

import { AuthModal } from '@/components/auth/AuthModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

export function OrdersLoginPrompt() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
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

          <Card className="p-12 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
              <UserIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>

            <Text variant="h2" className="mb-4 text-2xl font-semibold">
              Войдите в систему
            </Text>

            <Text className="text-muted-foreground mx-auto mb-8 max-w-md">
              Чтобы просматривать свои заказы, необходимо войти в систему. Это
              поможет нам показать только ваши заказы и обеспечить безопасность
              данных.
            </Text>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:w-auto"
                size="lg"
              >
                <UserIcon className="mr-2 h-5 w-5" />
                Войти в систему
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto"
                size="lg"
              >
                <Link href="/">
                  <ShoppingBagIcon className="mr-2 h-5 w-5" />
                  Перейти в каталог
                </Link>
              </Button>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
              <Text className="text-muted-foreground text-sm">
                Нет аккаунта? Войдите по номеру телефона — мы создадим его
                автоматически
              </Text>
            </div>
          </Card>
        </div>
      </div>

      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

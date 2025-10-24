'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useSwitcher } from '@/contexts/SwitcherContext';

interface MobileProfileProps {
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    role: string;
    providerId?: string | null;
  };
}

export function MobileProfile({ user }: MobileProfileProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { isSwitcherOpen } = useSwitcher();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/`;

      await signOut({
        callbackUrl: callbackUrl,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Profile Card - Above Header */}
      <div
        className={`relative -mt-4 px-4 ${isSwitcherOpen ? 'z-30' : 'z-[60]'}`}
      >
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-violet-100">
              <svg
                className="h-8 w-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <Text className="text-xl font-semibold text-gray-900">
                {user?.name || 'Имя не указано'}
              </Text>
              <Text className="text-sm text-gray-600">
                {user?.email || user?.phone || ''}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Menu Items */}
      <div className="px-4 py-2">
        <div className="space-y-3">
          {/* Orders */}
          <Link
            href="/orders"
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-purple-200 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
              <BoxIcon className="h-7 w-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                Заказы
              </Text>
              <Text className="text-sm text-gray-500">
                Просмотр истории заказов
              </Text>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-4 w-4 text-gray-600"
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
          </Link>

          {/* Favorites */}
          <Link
            href="/favorites"
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-purple-200 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-red-100">
              <HeartIcon className="h-7 w-7 text-red-600" />
            </div>
            <div className="flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                Избранное
              </Text>
              <Text className="text-sm text-gray-500">Сохраненные товары</Text>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-4 w-4 text-gray-600"
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
          </Link>
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-4 pb-8 pt-4">
        <Button
          variant="outline"
          className="h-12 w-full rounded-2xl border-2 border-gray-200 font-semibold transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Выходим…' : 'Выйти'}
        </Button>
      </div>
    </div>
  );
}

function BoxIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M3 7l9 4 9-4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M3 7v10l9 4 9-4V7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 11v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364 4.318 12.682a4.5 4.5 0 010-6.364z"
      />
    </svg>
  );
}

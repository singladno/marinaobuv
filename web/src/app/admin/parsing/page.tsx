'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';

interface Parser {
  id: string;
  name: string;
  description: string;
  type: 'wa' | 'tg';
}

const parsers: Parser[] = [
  {
    id: 'wa',
    name: 'Аггрегатор Садовода WhatsApp',
    description: 'Парсинг товаров из WhatsApp группы',
    type: 'wa',
  },
  {
    id: 'tg',
    name: '32-61/63 Telegram',
    description: 'Парсинг цветов из Telegram канала',
    type: 'tg',
  },
];

export default function ParsingPage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <Text variant="h2" className="mb-4">
          Парсеры
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Выберите парсер для просмотра деталей и статистики
        </Text>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parsers.map(parser => (
            <Card
              key={parser.id}
              className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
              onClick={() => router.push(`/admin/parsing/${parser.id}`)}
            >
              <Text variant="h3" className="mb-2">
                {parser.name}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {parser.description}
              </Text>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

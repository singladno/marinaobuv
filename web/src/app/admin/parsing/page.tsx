'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';

interface ParserItem {
  id: string;
  name: string;
  description: string;
  type: 'wa' | 'tg';
  sourceId: string | null;
  path: string;
}

export default function ParsingPage() {
  const router = useRouter();
  const [parsers, setParsers] = useState<ParserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/admin/parsers');
        if (!res.ok) throw new Error('Failed to load parsers');
        const data = await res.json();
        if (!cancelled) setParsers(data.parsers ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <Text variant="h2" className="mb-4">
          Парсеры
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Выберите парсер для просмотра деталей и статистики. WhatsApp: отдельная страница для каждого чата из WA_CHAT_IDS.
        </Text>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading && <Text>Загрузка...</Text>}
        {error && <Text className="text-red-600">{error}</Text>}
        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parsers.map(parser => (
              <Card
                key={parser.sourceId ?? parser.id}
                className="cursor-pointer p-6 transition-shadow hover:shadow-lg"
                onClick={() => router.push(`/admin/parsing/${parser.path}`)}
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
        )}
      </div>
    </div>
  );
}

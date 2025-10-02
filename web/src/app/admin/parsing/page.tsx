'use client';

import { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UnifiedDataTable } from '@/components/features/UnifiedDataTable';

interface ParsingHistoryItem {
  id: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  messagesRead: number;
  productsCreated: number;
  errorMessage: string | null;
  duration: number | null;
}

interface ParsingStatus {
  runningParsers: number;
  runningParsersDetails: Array<{
    id: string;
    startedAt: string;
    messagesRead: number;
    productsCreated: number;
  }>;
  latestCompleted: ParsingHistoryItem | null;
  latestFailed: ParsingHistoryItem | null;
  stats: {
    last24Hours: {
      runs: number;
      messagesRead: number;
      productsCreated: number;
    };
    last7Days: {
      runs: number;
      messagesRead: number;
      productsCreated: number;
    };
  };
  error?: string;
}

interface ParsingHistoryResponse {
  parsingHistory: ParsingHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: {
    runningParsers: number;
    totalMessagesRead: number;
    totalProductsCreated: number;
    averageDuration: number;
  };
  error?: string;
}

const createParsingHistoryColumns = (): ColumnDef<ParsingHistoryItem>[] => [
  {
    accessorKey: 'startedAt',
    header: 'Время запуска',
    cell: ({ getValue }) => {
      const dateString = getValue() as string;
      return new Date(dateString).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    },
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const getStatusColor = (status: string) => {
        switch (status) {
          case 'running':
            return 'text-blue-600 bg-blue-50';
          case 'completed':
            return 'text-green-600 bg-green-50';
          case 'failed':
            return 'text-red-600 bg-red-50';
          default:
            return 'text-gray-600 bg-gray-50';
        }
      };
      const getStatusText = (status: string) => {
        switch (status) {
          case 'running':
            return 'Выполняется';
          case 'completed':
            return 'Завершено';
          case 'failed':
            return 'Ошибка';
          default:
            return status;
        }
      };
      return (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
            status
          )}`}
        >
          {getStatusText(status)}
        </span>
      );
    },
  },
  {
    accessorKey: 'messagesRead',
    header: 'Сообщения',
  },
  {
    accessorKey: 'productsCreated',
    header: 'Товары',
  },
  {
    accessorKey: 'duration',
    header: 'Длительность',
    cell: ({ getValue }) => {
      const seconds = getValue() as number | null;
      if (!seconds) return 'N/A';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    },
  },
  {
    accessorKey: 'completedAt',
    header: 'Завершение',
    cell: ({ getValue }) => {
      const completedAt = getValue() as string | null;
      if (!completedAt) return '-';
      return new Date(completedAt).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    },
  },
];

export default function ParsingPage() {
  const [parsingHistory, setParsingHistory] = useState<ParsingHistoryItem[]>(
    []
  );
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<any>(null);

  const fetchParsingHistory = async (
    page: number = 1,
    status: string = 'all'
  ) => {
    try {
      const response = await fetch(
        `/api/admin/parsing-history?page=${page}&limit=20&status=${status}`
      );
      const data: ParsingHistoryResponse = await response.json();

      if (response.ok) {
        setParsingHistory(data.parsingHistory);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch parsing history');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const fetchParsingStatus = async () => {
    try {
      const response = await fetch('/api/admin/parsing-status');
      const data: ParsingStatus = await response.json();

      if (response.ok) {
        setParsingStatus(data);
      } else {
        setError(data.error || 'Failed to fetch parsing status');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchParsingHistory(currentPage, statusFilter),
        fetchParsingStatus(),
      ]);
      setLoading(false);
    };

    loadData();

    // Refresh status every 5 seconds for real-time updates
    const interval = setInterval(fetchParsingStatus, 5000);
    return () => clearInterval(interval);
  }, [currentPage, statusFilter]);

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <Text variant="h2" className="mb-4">
            Мониторинг парсинга
          </Text>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Text>Загрузка...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <Text variant="h2" className="mb-4">
            Мониторинг парсинга
          </Text>
        </div>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <Text className="mb-4 text-red-600">Ошибка: {error}</Text>
          <Button onClick={() => window.location.reload()}>Обновить</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header Section */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <Text variant="h2" className="mb-4">
          Мониторинг парсинга
        </Text>

        {/* Action Buttons */}
        <div className="mb-4 flex gap-4">
          <Button
            onClick={() => {
              fetchParsingStatus();
              fetchParsingHistory(currentPage, statusFilter);
            }}
            variant="outline"
          >
            Обновить статус
          </Button>
        </div>

        {/* Current Status */}
        {parsingStatus && (
          <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <Text className="text-sm text-gray-600">Активные парсеры</Text>
              <Text variant="h3" className="text-blue-600">
                {parsingStatus.runningParsers}
              </Text>
              {parsingStatus.runningParsers > 0 && (
                <div className="mt-2 space-y-1">
                  {parsingStatus.runningParsersDetails.map((parser, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      <div>Сообщений: {parser.messagesRead}</div>
                      <div>Товаров: {parser.productsCreated}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <Text className="text-sm text-gray-600">За 24 часа</Text>
              <Text variant="h3" className="text-green-600">
                {parsingStatus.stats.last24Hours.runs} запусков
              </Text>
              <Text className="text-sm text-gray-500">
                {parsingStatus.stats.last24Hours.messagesRead} сообщений,{' '}
                {parsingStatus.stats.last24Hours.productsCreated} товаров
              </Text>
            </Card>

            <Card className="p-4">
              <Text className="text-sm text-gray-600">За 7 дней</Text>
              <Text variant="h3" className="text-purple-600">
                {parsingStatus.stats.last7Days.runs} запусков
              </Text>
              <Text className="text-sm text-gray-500">
                {parsingStatus.stats.last7Days.messagesRead} сообщений,{' '}
                {parsingStatus.stats.last7Days.productsCreated} товаров
              </Text>
            </Card>

            <Card className="p-4">
              <Text className="text-sm text-gray-600">Последний запуск</Text>
              {parsingStatus.latestCompleted ? (
                <div>
                  <Text className="text-sm text-green-600">
                    {new Date(
                      parsingStatus.latestCompleted.completedAt!
                    ).toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {parsingStatus.latestCompleted.messagesRead} сообщений,{' '}
                    {parsingStatus.latestCompleted.productsCreated} товаров
                  </Text>
                </div>
              ) : (
                <Text className="text-sm text-gray-500">Нет данных</Text>
              )}
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <Text className="text-sm font-medium">Фильтр по статусу:</Text>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded border border-gray-300 px-3 py-1 text-sm"
            aria-label="Фильтр по статусу парсинга"
          >
            <option value="all">Все</option>
            <option value="running">Выполняется</option>
            <option value="completed">Завершено</option>
            <option value="failed">Ошибка</option>
          </select>
        </div>
      </div>

      {/* Table Section with proper scroll container */}
      <div className="min-h-0 flex-1">
        <UnifiedDataTable<ParsingHistoryItem>
          data={parsingHistory}
          columns={createParsingHistoryColumns()}
          loading={loading}
          error={error}
          pagination={
            pagination
              ? {
                  page: pagination.page,
                  pageSize: 20,
                  total: pagination.totalCount,
                  totalPages: pagination.totalPages,
                }
              : undefined
          }
          onPageChange={setCurrentPage}
          onPageSizeChange={() => {}}
          emptyMessage="История парсинга не найдена"
          loadingMessage="Загрузка истории парсинга..."
        />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { useNotifications } from '@/components/ui/NotificationProvider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface OldPortalSyncPayload {
  displayStatus: 'none' | 'running' | 'success' | 'failed';
  lastError?: string | null;
  lastCompletedAt?: string | null;
}

interface GroupedExport {
  date: string;
  timestamp: string;
  productCount?: number;
  csv?: {
    filename: string;
    size: number;
    s3Url?: string;
    localPath?: string;
    productCount?: number;
  };
  xml?: {
    filename: string;
    size: number;
    s3Url?: string;
    localPath?: string;
    productCount?: number;
  };
  oldPortalSync?: OldPortalSyncPayload;
}

const EXPORT_RANGE_LABELS: Record<'all' | '1d' | '3d' | '7d' | '30d', string> =
  {
    all: 'За всё время',
    '1d': '1 день',
    '3d': '3 дня',
    '7d': '1 неделя',
    '30d': '1 месяц',
  };

/** Must match `MAX_PRODUCT_EXPORT_ITEM_LIMIT` on the server. */
const MAX_EXPORT_ITEM_LIMIT = 100_000;

function parseItemLimitForExport(
  raw: string
): { limit?: number } | { error: string } {
  const t = raw.trim();
  if (t === '') {
    return { limit: undefined };
  }
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return {
      error:
        'Введите целое число; 0 или пусто — без ограничения по количеству товаров.',
    };
  }
  if (n === 0) {
    return { limit: undefined };
  }
  if (n < 0) {
    return { error: 'Укажите 0 (без лимита) или число от 1 и выше.' };
  }
  if (n > MAX_EXPORT_ITEM_LIMIT) {
    return {
      error: `Не больше ${MAX_EXPORT_ITEM_LIMIT.toLocaleString('ru-RU')}.`,
    };
  }
  return { limit: n };
}

interface ExportStatus {
  lastExportDate: string | null;
  nextScheduledExport: string;
  cronEnabled: boolean;
  timezone: string;
  currentExport?: {
    status: 'idle' | 'running' | 'completed' | 'failed';
    startedAt?: string;
    completedAt?: string;
    progress?: {
      current: number;
      total: number;
      message?: string;
    };
    error?: string;
  };
}

export default function AdminExportsPage() {
  const [exports, setExports] = useState<GroupedExport[]>([]);
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [onlyNew, setOnlyNew] = useState(true);
  const [exportRange, setExportRange] = useState<
    'all' | '1d' | '3d' | '7d' | '30d'
  >('all');
  /** "0" or empty = no cap; otherwise 1…MAX_EXPORT_ITEM_LIMIT. */
  const [itemLimitInput, setItemLimitInput] = useState('0');
  const [updateKey, setUpdateKey] = useState(0); // Force re-render key
  const [oldPortalImportRunning, setOldPortalImportRunning] = useState(false);
  const [oldPortalImportCurrent, setOldPortalImportCurrent] = useState<{
    xmlFilename: string;
    startedAt: string;
  } | null>(null);
  const { addNotification } = useNotifications();

  // Polling interval for status updates
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  const fetchExports = async () => {
    try {
      const response = await fetch('/api/admin/products/export/list');
      if (!response.ok) throw new Error('Failed to fetch exports');
      const data = await response.json();
      setExports(data.exports || []);
      setOldPortalImportRunning(Boolean(data.oldPortalImportRunning));
      setOldPortalImportCurrent(data.oldPortalImportCurrent ?? null);
    } catch (error) {
      console.error('Error fetching exports:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось загрузить список экспортов',
      });
    }
  };

  const fetchStatus = async () => {
    try {
      // Add timestamp to prevent caching
      const response = await fetch(
        `/api/admin/exports/status?t=${Date.now()}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();

      // Always create completely new objects to force React to detect changes
      const newStatus: ExportStatus = JSON.parse(
        JSON.stringify({
          lastExportDate: data.lastExportDate || null,
          nextScheduledExport: data.nextScheduledExport || '',
          cronEnabled: data.cronEnabled ?? true,
          timezone: data.timezone || '',
          currentExport: data.currentExport || undefined,
        })
      );

      // Update status state using functional update to ensure React sees the change
      setStatus(() => newStatus);

      // Update exporting state based on current export status
      const isRunning = newStatus?.currentExport?.status === 'running';
      setExporting(prev => {
        if (prev !== isRunning) {
          return isRunning;
        }
        return prev;
      });

      // Force re-render by updating key
      setUpdateKey(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const triggerOldPortalSync = async (xmlFilename: string) => {
    if (oldPortalImportRunning) {
      addNotification({
        type: 'warning',
        title: 'Уже выполняется',
        message:
          'Загрузка XML на старый портал уже идёт. Дождитесь завершения.',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/exports/old-portal-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlFilename }),
      });

      const payload = await response.json().catch(() => ({}));

      if (response.status === 409) {
        addNotification({
          type: 'warning',
          title: 'Занято',
          message:
            payload.message ||
            'Другой импорт на старый портал уже выполняется.',
        });
        await fetchExports();
        return;
      }

      if (!response.ok) {
        throw new Error(
          payload.message || payload.error || 'Не удалось запустить импорт'
        );
      }

      addNotification({
        type: 'success',
        title: 'Запущено',
        message:
          'Импорт XML на старый портал выполняется. Статус обновится автоматически.',
      });
      await fetchExports();
    } catch (error) {
      console.error('Old portal sync:', error);
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message:
          error instanceof Error
            ? error.message
            : 'Не удалось запустить импорт на старый портал',
      });
    }
  };

  const triggerExport = async () => {
    // Check if export is already running
    if (status?.currentExport?.status === 'running') {
      addNotification({
        type: 'warning',
        title: 'Внимание',
        message: 'Экспорт уже выполняется. Пожалуйста, подождите.',
      });
      return;
    }

    const parsed = parseItemLimitForExport(itemLimitInput);
    if ('error' in parsed) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: parsed.error,
      });
      return;
    }
    const { limit } = parsed;

    setExporting(true);

    // Immediately update UI to show export is starting
    setStatus(prevStatus => ({
      ...(prevStatus || {}),
      lastExportDate: prevStatus?.lastExportDate || null,
      nextScheduledExport: prevStatus?.nextScheduledExport || '',
      cronEnabled: prevStatus?.cronEnabled ?? true,
      timezone: prevStatus?.timezone || '',
      currentExport: {
        status: 'running',
        startedAt: new Date().toISOString(),
        progress: {
          current: 0,
          total: 2,
          message: 'Запуск экспорта...',
        },
      },
    }));

    try {
      const response = await fetch('/api/admin/exports/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onlyNew: exportRange === 'all' && onlyNew,
          range: exportRange,
          ...(limit !== undefined && { limit }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to trigger export');
      }

      const data = await response.json();

      // Start polling for status updates
      startPolling();

      addNotification({
        type: 'success',
        title: 'Успех',
        message: 'Экспорт запущен. Отслеживание прогресса...',
      });

      // Refresh status immediately to get real server state
      await fetchStatus();
    } catch (error) {
      console.error('Error triggering export:', error);

      // Reset status on error
      setStatus(prevStatus => ({
        ...(prevStatus || {}),
        lastExportDate: prevStatus?.lastExportDate || null,
        nextScheduledExport: prevStatus?.nextScheduledExport || '',
        cronEnabled: prevStatus?.cronEnabled ?? true,
        timezone: prevStatus?.timezone || '',
        currentExport: {
          status: 'failed',
          startedAt: prevStatus?.currentExport?.startedAt,
          completedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));

      addNotification({
        type: 'error',
        title: 'Ошибка',
        message:
          error instanceof Error
            ? error.message
            : 'Не удалось запустить экспорт',
      });
      setExporting(false);
    }
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const startPolling = () => {
    // Clear existing interval
    stopPolling();

    console.log('🔄 Starting polling for export status...');

    // Start polling every 1 second for more responsive updates
    const interval = setInterval(async () => {
      try {
        // Fetch status and update state - this will trigger re-render
        await fetchStatus();

        // Also check status separately to determine if we should stop polling
        const response = await fetch(
          `/api/admin/exports/status?t=${Date.now()}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }
        );
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        const currentStatus = await response.json();

        const exportStatus = currentStatus?.currentExport?.status;

        // Update exporting state based on current export status
        if (exportStatus === 'running') {
          setExporting(true);
        } else if (exportStatus === 'completed' || exportStatus === 'failed') {
          console.log('✅ Export finished, stopping polling');
          clearInterval(interval);
          setPollingInterval(null);
          setExporting(false);

          // Refresh exports list with a small delay to ensure S3 has updated
          setTimeout(async () => {
            await fetchExports();
          }, 1000);

          if (exportStatus === 'completed') {
            // Force status and exports refresh
            await fetchStatus();
            setTimeout(async () => {
              await fetchExports();
            }, 500);

            addNotification({
              type: 'success',
              title: 'Экспорт завершен',
              message:
                'Экспорт товаров успешно завершен. Если список не обновился, обновите страницу.',
            });
          }
        } else if (exportStatus === 'idle') {
          // Export is idle, stop polling
          console.log('⏸️ Export is idle, stopping polling');
          clearInterval(interval);
          setPollingInterval(null);
          setExporting(false);
        }
      } catch (error) {
        console.error('Error during polling:', error);
        // Continue polling even on error
      }
    }, 1000); // Poll every 1 second for more responsive updates

    setPollingInterval(interval);
  };

  // Effect to sync exporting state with status changes
  useEffect(() => {
    const exportStatus = status?.currentExport?.status;
    if (exportStatus === 'running') {
      setExporting(true);
    } else if (
      exportStatus === 'completed' ||
      exportStatus === 'failed' ||
      exportStatus === 'idle'
    ) {
      setExporting(false);
    }
  }, [status?.currentExport?.status, status?.currentExport?.progress?.message]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchExports(), fetchStatus()]);
      setLoading(false);
    };
    loadData();

    // Check if export is running and start polling
    const checkAndStartPolling = async () => {
      try {
        const response = await fetch('/api/admin/exports/status', {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const currentStatus = await response.json();

        if (currentStatus?.currentExport?.status === 'running') {
          setExporting(true);
          startPolling();
        } else if (
          currentStatus?.currentExport?.status === 'completed' ||
          currentStatus?.currentExport?.status === 'failed'
        ) {
          // Refresh exports list if export just completed
          await fetchExports();
        }
      } catch (error) {
        console.error('Error checking export status:', error);
      }
    };

    checkAndStartPolling();

    // Cleanup polling on unmount
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!oldPortalImportRunning) return;
    const interval = setInterval(() => {
      void fetchExports();
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oldPortalImportRunning]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string, timestamp?: string): string => {
    // If timestamp includes time (YYYY-MM-DD-HH-MM-SS), parse it
    if (timestamp && timestamp.includes('-')) {
      const parts = timestamp.split('-');
      if (parts.length >= 6) {
        // Format: YYYY-MM-DD-HH-MM-SS
        const datePart = parts.slice(0, 3).join('-');
        const timePart = parts.slice(3, 6).join(':');
        const fullDate = `${datePart}T${timePart}`;
        try {
          return new Date(fullDate).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          // Fall through to default
        }
      }
    }
    // Fallback to dateString
    try {
      return new Date(dateString).toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header: title + toolbar in one card */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Экспорт товаров
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Управление экспортом товаров (CSV/XML, в том числе для Excel)
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div className="flex min-w-0 flex-col gap-1.5">
                <span
                  className="text-xs font-medium text-gray-600 dark:text-gray-400"
                  id="export-period-label"
                >
                  Период
                </span>
                <Select
                  value={exportRange}
                  onValueChange={v => {
                    setExportRange(v as 'all' | '1d' | '3d' | '7d' | '30d');
                    if (v !== 'all') setOnlyNew(false);
                  }}
                  disabled={
                    exporting || status?.currentExport?.status === 'running'
                  }
                >
                  <SelectTrigger
                    className="h-10 w-full min-w-0 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[12rem]"
                    aria-labelledby="export-period-label"
                  >
                    <SelectValue placeholder="Выберите период">
                      {EXPORT_RANGE_LABELS[exportRange]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">За всё время</SelectItem>
                    <SelectItem value="1d">1 день</SelectItem>
                    <SelectItem value="3d">3 дня</SelectItem>
                    <SelectItem value="7d">1 неделя</SelectItem>
                    <SelectItem value="30d">1 месяц</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-0 flex-col gap-1.5">
                <span
                  className="text-xs font-medium text-gray-600 dark:text-gray-400"
                  id="export-limit-label"
                >
                  Макс. товаров
                </span>
                <Input
                  id="export-item-limit"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_EXPORT_ITEM_LIMIT}
                  step={1}
                  value={itemLimitInput}
                  onChange={e => setItemLimitInput(e.target.value)}
                  placeholder="0 = без лимита"
                  title={`0 или пусто — без ограничения; иначе от 1 до ${MAX_EXPORT_ITEM_LIMIT.toLocaleString('ru-RU')}.`}
                  disabled={
                    exporting || status?.currentExport?.status === 'running'
                  }
                  aria-labelledby="export-limit-label"
                  className="h-10 w-full min-w-0 max-w-full disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-[10rem] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Фильтр
                </span>
                <label className="flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg border border-transparent px-0.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <Checkbox
                    checked={onlyNew}
                    onCheckedChange={setOnlyNew}
                    disabled={
                      exporting ||
                      status?.currentExport?.status === 'running' ||
                      exportRange !== 'all'
                    }
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Только новые товары
                  </span>
                </label>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 pt-3 lg:border-t-0 lg:pt-0 dark:border-gray-600">
              <Button
                onClick={triggerExport}
                disabled={
                  exporting || status?.currentExport?.status === 'running'
                }
                className="h-10 w-full min-w-[12rem] bg-blue-600 px-4 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 lg:min-w-[11.5rem]"
              >
                {exporting || status?.currentExport?.status === 'running' ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 shrink-0 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {status?.currentExport?.progress?.message || 'Экспорт...'}
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4 shrink-0" />
                    Запустить экспорт
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Progress */}
      {status?.currentExport?.status === 'running' && (
        <div
          key={`export-progress-${updateKey}`}
          className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <svg
                className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Экспорт выполняется...
              </p>
              {status.currentExport.progress?.message && (
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                  {status.currentExport.progress.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Cards */}
      {status && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Последний экспорт
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {status.lastExportDate
                    ? formatDate(status.lastExportDate)
                    : 'Никогда'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <ClockIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Следующий экспорт
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(status.nextScheduledExport)}
                </p>
                {status.cronEnabled && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Автоматически в 02:00
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {oldPortalImportRunning && oldPortalImportCurrent ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
          <ArrowPathIcon className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-700 dark:text-amber-400" />
          <div>
            <p className="font-medium">
              Импорт XML на старый портал выполняется (один файл за раз)
            </p>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
              {oldPortalImportCurrent.xmlFilename}
            </p>
          </div>
        </div>
      ) : null}

      {/* Exports List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            История экспортов
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Загрузка...
            </p>
          </div>
        ) : exports.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Экспорты еще не созданы
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Нажмите &quot;Запустить экспорт&quot; для создания первого
              экспорта
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Форматы
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Товаров
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Размер
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Старый портал
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {exports.map((exp, index) => {
                  const totalSize = (exp.csv?.size || 0) + (exp.xml?.size || 0);
                  const hasBoth = exp.csv && exp.xml;
                  const sync = exp.oldPortalSync;
                  const rowImportLocked =
                    oldPortalImportRunning || sync?.displayStatus === 'running';

                  return (
                    <tr
                      key={`${exp.timestamp}-${index}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {formatDate(exp.date, exp.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {exp.csv && (
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              CSV
                            </span>
                          )}
                          {exp.xml && (
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              XML
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {exp.productCount !== undefined
                          ? exp.productCount.toLocaleString('ru-RU')
                          : '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatFileSize(totalSize)}
                        {hasBoth && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({formatFileSize(exp.csv!.size)} +{' '}
                            {formatFileSize(exp.xml!.size)})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {!exp.xml ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="flex min-w-[10rem] flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <div
                              className="flex items-center gap-1.5"
                              title={
                                sync?.lastError
                                  ? sync.lastError
                                  : sync?.lastCompletedAt
                                    ? `Завершено: ${new Date(sync.lastCompletedAt).toLocaleString('ru-RU')}`
                                    : undefined
                              }
                            >
                              {sync?.displayStatus === 'running' && (
                                <>
                                  <ArrowPathIcon className="h-5 w-5 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
                                  <span className="text-xs text-amber-800 dark:text-amber-200">
                                    Идёт…
                                  </span>
                                </>
                              )}
                              {sync?.displayStatus === 'success' && (
                                <CheckCircleIcon
                                  className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400"
                                  title="Загружено на старый портал"
                                />
                              )}
                              {sync?.displayStatus === 'failed' && (
                                <XCircleIcon
                                  className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                                  title={sync?.lastError || 'Ошибка импорта'}
                                />
                              )}
                              {(!sync || sync.displayStatus === 'none') && (
                                <span
                                  className="text-xs text-gray-500 dark:text-gray-400"
                                  title="Этот XML ещё не отправляли на старый портал"
                                >
                                  Не отправлялся
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={rowImportLocked}
                              title={
                                rowImportLocked
                                  ? 'Дождитесь завершения текущего импорта на старый портал'
                                  : 'Отправить URL этого XML на старый портал (POST mo_ajax.php)'
                              }
                              className="whitespace-nowrap"
                              onClick={() =>
                                exp.xml &&
                                triggerOldPortalSync(exp.xml.filename)
                              }
                            >
                              <PlayIcon className="mr-1 h-3.5 w-3.5 shrink-0" />
                              На портал
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        {hasBoth ? (
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={exp.csv!.s3Url}
                              download
                              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                              CSV
                            </a>
                            <a
                              href={exp.xml!.s3Url}
                              download
                              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                              XML
                            </a>
                          </div>
                        ) : exp.csv ? (
                          <a
                            href={exp.csv.s3Url}
                            download
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Скачать CSV
                          </a>
                        ) : exp.xml ? (
                          <a
                            href={exp.xml.s3Url}
                            download
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            Скачать XML
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

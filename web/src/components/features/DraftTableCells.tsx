import * as React from 'react';

import type { Draft } from '@/types/admin';

interface ImagesCellProps {
  images: Draft['images'];
}

export function ImagesCell({ images }: ImagesCellProps) {
  const sortedImages = (images || []).sort(
    (a, b) => (a.sort || 0) - (b.sort || 0)
  );

  if (!sortedImages.length) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <div className="flex gap-1">
      {sortedImages.slice(0, 4).map(img => (
        <div
          key={img.id}
          className="relative h-12 w-12 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
        >
          <img
            src={img.url}
            alt={img.alt || `Изображение ${(img.sort || 0) + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={e => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              console.error('Failed to load image:', img.url);
            }}
          />
        </div>
      ))}
      {sortedImages.length > 4 && (
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          +{sortedImages.length - 4}
        </div>
      )}
    </div>
  );
}

interface SizesCellProps {
  sizes: Draft['sizes'];
}

export function SizesCell({ sizes }: SizesCellProps) {
  if (!Array.isArray(sizes) || !sizes.length) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {sizes.map((x, index) => (
        <span
          key={index}
          className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        >
          {x.size}:{x.stock ?? x.count ?? 0}
        </span>
      ))}
    </div>
  );
}

interface ProviderCellProps {
  provider: Draft['provider'];
}

export function ProviderCell({ provider }: ProviderCellProps) {
  if (!provider) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  return (
    <div className="min-w-0">
      <div className="truncate">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {provider.name}
        </div>
        {provider.phone && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {provider.phone}
          </div>
        )}
        {provider.place && (
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            📍 {provider.place}
          </div>
        )}
      </div>
    </div>
  );
}

interface PriceCellProps {
  value: number | null;
  formatter: (value: number) => string;
}

export function PriceCell({ value, formatter }: PriceCellProps) {
  return (
    <div className="text-center">
      {value != null ? (
        <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
          {formatter(value)}
        </span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500">—</span>
      )}
    </div>
  );
}

interface BadgeCellProps {
  value: string | null;
  getLabel: (value: string) => string;
  bgColor: string;
  textColor: string;
}

export function BadgeCell({
  value,
  getLabel,
  bgColor,
  textColor,
}: BadgeCellProps) {
  return (
    <div className="text-center">
      {value ? (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}
        >
          {getLabel(value)}
        </span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500">—</span>
      )}
    </div>
  );
}

interface EditableCellProps {
  value: string | null;
  onBlur: (value: string | null) => void;
  placeholder: string;
  'aria-label': string;
}

export function EditableCell({
  value,
  onBlur,
  placeholder,
  'aria-label': ariaLabel,
}: EditableCellProps) {
  const [localValue, setLocalValue] = React.useState(value ?? '');

  return (
    <input
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={() => onBlur(localValue || null)}
      aria-label={ariaLabel}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
      placeholder={placeholder}
    />
  );
}

interface SourceCellProps {
  source:
    | Array<{
        id: string;
        waMessageId: string;
        from: string | null;
        fromName: string | null;
        type: string | null;
        text: string | null;
        timestamp: number | null;
        mediaUrl: string | null;
        mediaMimeType: string | null;
        mediaWidth: number | null;
        mediaHeight: number | null;
        createdAt: string;
        provider: {
          name: string;
        } | null;
      }>
    | null
    | undefined;
}

export function SourceCell({ source }: SourceCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!source || source.length === 0) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'Неизвестно';
    const date = new Date(timestamp * 1000);
    return (
      <div className="text-sm">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {date.toLocaleDateString('ru-RU')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {date.toLocaleTimeString('ru-RU')}
        </div>
      </div>
    );
  };

  const formatCreatedAt = (createdAt: string) => {
    const date = new Date(createdAt);
    return (
      <div className="text-sm">
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {date.toLocaleDateString('ru-RU')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {date.toLocaleTimeString('ru-RU')}
        </div>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
      >
        {source.length} сообщений
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Источник сообщений</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {source.map((message, index) => (
                <div
                  key={message.id}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="mb-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">
                      {message.fromName ||
                        message.from ||
                        'Неизвестный отправитель'}
                    </span>
                    <span>
                      {formatTimestamp(message.timestamp) ||
                        formatCreatedAt(message.createdAt)}
                    </span>
                  </div>

                  {message.provider && (
                    <div className="mb-2 text-xs text-blue-600 dark:text-blue-400">
                      Поставщик: {message.provider.name}
                    </div>
                  )}

                  {message.text && (
                    <div className="mb-2 whitespace-pre-wrap text-sm">
                      {message.text}
                    </div>
                  )}

                  {message.type === 'image' && message.mediaUrl && (
                    <div className="mt-2">
                      <img
                        src={message.mediaUrl}
                        alt="Изображение из сообщения"
                        className="max-h-48 max-w-full rounded border object-contain"
                        loading="lazy"
                      />
                      {message.mediaMimeType && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {message.mediaMimeType}
                          {message.mediaWidth && message.mediaHeight && (
                            <span>
                              {' '}
                              ({message.mediaWidth}×{message.mediaHeight})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {message.type && message.type !== 'image' && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Тип: {message.type}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    ID: {message.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface GptRequestCellProps {
  gptRequest: string | null | undefined;
}

export function GptRequestCell({ gptRequest }: GptRequestCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!gptRequest) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const truncated =
    gptRequest.length > 50 ? gptRequest.substring(0, 50) + '...' : gptRequest;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-left text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        title={gptRequest}
      >
        {truncated}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">GPT Запрос</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded border p-4 text-sm">
              {gptRequest}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}

interface GptResponseCellProps {
  rawGptResponse: any;
}

export function GptResponseCell({ rawGptResponse }: GptResponseCellProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!rawGptResponse) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const responseText = JSON.stringify(rawGptResponse, null, 2);
  const truncated =
    responseText.length > 50
      ? responseText.substring(0, 50) + '...'
      : responseText;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-left text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
        title={responseText}
      >
        {truncated}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">GPT Ответ</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded border p-4 text-sm">
              {responseText}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}

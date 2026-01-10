'use client';

import { useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Text } from '@/components/ui/Text';
import { type CategoryNode } from '@/components/ui/CategorySelector';
import { useCreateProductForm } from '@/hooks/useCreateProductForm';
import { AggregatorIcon } from '@/components/icons/AggregatorIcon';

import { CreateProductFormFields } from './CreateProductFormFields';
import { ProductImageUpload, type ImageFile } from './ProductImageUpload';
import { ProductImageUploadArea } from './ProductImageUploadArea';
import { ProductVideoUpload, type VideoFile } from './ProductVideoUpload';

export type { ImageFile, VideoFile };

export interface CreateProductData {
  name: string;
  categoryId: string;
  pricePair: number;
  buyPrice?: number | null;
  material: string;
  gender: 'FEMALE' | 'MALE';
  season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  description: string;
  sizes: Array<{ size: string; count: number }>;
  images?: ImageFile[];
  videos?: VideoFile[];
  sourceScreenshot?: ImageFile | null;
  providerId?: string | null;
  measurementUnit?: 'PAIRS' | 'PIECES';
}

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateProductData) => Promise<void>;
  categories: CategoryNode[];
  isLoading?: boolean;
}

export function CreateProductModal({
  isOpen,
  onClose,
  onCreate,
  categories,
  isLoading = false,
}: CreateProductModalProps) {
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    validate,
    prepareSubmitData,
    reset,
    clearError,
  } = useCreateProductForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [sourceScreenshot, setSourceScreenshot] = useState<File | null>(null);
  const [sourceScreenshotPreview, setSourceScreenshotPreview] = useState<
    string | null
  >(null);
  const [showAggregatorInput, setShowAggregatorInput] = useState(false);
  const [aggregatorDataId, setAggregatorDataId] = useState('');
  const [aggregatorHtml, setAggregatorHtml] = useState('');
  const [isParsingAggregator, setIsParsingAggregator] = useState(false);
  const [isTestParsing, setIsTestParsing] = useState(false);
  const [meditationQuote, setMeditationQuote] = useState('');
  const [meditationAuthor, setMeditationAuthor] = useState('');
  const isDev = process.env.NODE_ENV !== 'production';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validate()) {
      return;
    }

    // Validate images have colors
    const imagesWithoutColor = images.filter(img => !img.color.trim());
    if (imagesWithoutColor.length > 0) {
      setErrors({ submit: 'Укажите цвет для всех изображений' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const submitData = prepareSubmitData();
      // Include images and source screenshot in submit data
      const dataWithImages = {
        ...submitData,
        images,
        videos,
        sourceScreenshot: sourceScreenshot
          ? ({
              file: sourceScreenshot,
              preview: sourceScreenshotPreview || '',
            } as ImageFile)
          : null,
      };
      await onCreate(dataWithImages);
      reset();
      setImages([]);
      videos.forEach(video => {
        if (video.preview.startsWith('blob:')) {
          URL.revokeObjectURL(video.preview);
        }
      });
      setVideos([]);
      if (sourceScreenshotPreview) {
        URL.revokeObjectURL(sourceScreenshotPreview);
      }
      setSourceScreenshot(null);
      setSourceScreenshotPreview(null);
      onClose();
    } catch (error) {
      console.error('Error creating product:', error);
      setErrors({ submit: 'Не удалось создать товар. Попробуйте еще раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      // Clean up image previews
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      // Clean up video previews
      videos.forEach(video => {
        if (video.preview.startsWith('blob:')) {
          URL.revokeObjectURL(video.preview);
        }
      });
      setVideos([]);
      if (sourceScreenshotPreview) {
        URL.revokeObjectURL(sourceScreenshotPreview);
      }
      setSourceScreenshot(null);
      setSourceScreenshotPreview(null);
      onClose();
    }
  };

  const handleFieldChange = (field: keyof CreateProductData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const fetchMeditationText = async () => {
    try {
      console.log('[CreateProductModal] Fetching meditation text...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/admin/meditation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(
        '[CreateProductModal] Meditation response status:',
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[CreateProductModal] Meditation data:', data);
        if (data.quote && data.quote.trim()) {
          console.log(
            '[CreateProductModal] Setting meditation quote:',
            data.quote
          );
          setMeditationQuote(data.quote.trim());
          setMeditationAuthor(data.author?.trim() || '');
        } else {
          console.warn(
            '[CreateProductModal] No quote in meditation response, data:',
            data
          );
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          '[CreateProductModal] Meditation API error:',
          response.status,
          errorData
        );
        // If there's an error message in the response, we could show it, but for now just use default
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('[CreateProductModal] Meditation request timed out');
      } else {
        console.error(
          '[CreateProductModal] Error fetching meditation text:',
          error
        );
      }
      // Don't show error to user, just use default text
    }
  };

  const handleAggregatorParse = async () => {
    if (!aggregatorDataId.trim()) {
      setErrors({ submit: 'Введите data-id товара из агрегатора' });
      return;
    }

    setIsParsingAggregator(true);
    setErrors({});
    // Clear meditation quote immediately when starting new parse
    setMeditationQuote('');
    setMeditationAuthor('');

    // Fetch meditation text (non-blocking)
    fetchMeditationText();

    try {
      const response = await fetch('/api/admin/products/parse-aggregator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataId: aggregatorDataId.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 'Не удалось распарсить товар из агрегатора'
        );
      }

      const result = await response.json();

      // Close this modal and open edit modal with the created product
      onClose();

      // The parent component should handle opening the edit modal
      // We'll need to pass the productId back through a callback
      if (result.productId) {
        // Trigger a custom event or use a callback
        window.dispatchEvent(
          new CustomEvent('aggregatorProductParsed', {
            detail: { productId: result.productId },
          })
        );
      }
    } catch (error) {
      console.error('Error parsing aggregator product:', error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Не удалось распарсить товар из агрегатора',
      });
    } finally {
      setIsParsingAggregator(false);
      setMeditationQuote('');
      setMeditationAuthor('');
    }
  };

  const handleAggregatorParseHtml = async () => {
    if (!aggregatorHtml.trim()) {
      setErrors({ submit: 'Вставьте HTML страницы товара из агрегатора' });
      return;
    }

    setIsParsingAggregator(true);
    setErrors({});
    setMeditationQuote('');
    setMeditationAuthor('');

    // Fetch meditation text (non-blocking)
    fetchMeditationText();

    try {
      const response = await fetch('/api/admin/products/parse-aggregator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html: aggregatorHtml }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 'Не удалось распарсить товар из HTML агрегатора'
        );
      }

      const result = await response.json();

      // Close this modal and open edit modal with the created product
      onClose();

      if (result.productId) {
        window.dispatchEvent(
          new CustomEvent('aggregatorProductParsed', {
            detail: { productId: result.productId },
          })
        );
      }
    } catch (error) {
      console.error('Error parsing aggregator product from HTML:', error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Не удалось распарсить товар из HTML агрегатора',
      });
    } finally {
      setIsParsingAggregator(false);
      setMeditationQuote('');
      setMeditationAuthor('');
    }
  };

  const handleAggregatorParseHtmlTest = async () => {
    if (!aggregatorDataId.trim()) {
      setErrors({ submit: 'Введите data-id товара из агрегатора' });
      return;
    }

    setIsTestParsing(true);
    setIsParsingAggregator(true);
    setErrors({});
    // Clear meditation quote to prevent any meditation UI
    setMeditationQuote('');
    setMeditationAuthor('');

    try {
      const response = await fetch('/api/admin/products/parse-aggregator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataId: aggregatorDataId.trim(), test: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 'Не удалось распарсить HTML для теста'
        );
      }

      const result = await response.json();
      console.log('[TEST] Parsed HTML data:', result.parsedData);
      alert('Парсинг завершен! Проверьте консоль сервера для деталей.');
    } catch (error) {
      console.error('Error in test parsing:', error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Не удалось распарсить HTML для теста',
      });
    } finally {
      setIsParsingAggregator(false);
      setIsTestParsing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Создать товар"
      size="fullscreen"
    >
      <div className="relative flex h-full flex-col overflow-hidden">
        {isParsingAggregator && !isTestParsing && (
          <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-sky-100 via-sky-200 to-blue-300 backdrop-blur-sm">
            {/* Full-width progress bar at the top */}
            <div className="absolute left-0 right-0 top-0 h-1 overflow-hidden bg-sky-200/50">
              <div className="h-full w-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
            </div>

            <div className="mx-4 w-full max-w-xl rounded-3xl bg-white/95 p-8 text-center shadow-2xl ring-1 ring-blue-100/50 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-6 text-gray-800">
                {/* Colored chat-style loader (same style as client chat) */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
                    <div className="h-3 w-3 animate-bounce rounded-full bg-emerald-400 [animation-delay:-0.15s]" />
                    <div className="h-3 w-3 animate-bounce rounded-full bg-purple-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-800">
                    Идёт импорт товара из агрегатора
                  </p>
                  <p className="text-sm text-gray-600">
                    Пожалуйста, не закрывайте страницу и не перезагружайте
                    браузер до завершения парсинга. Это может занять какое-то
                    время.
                  </p>
                </div>

                {/* Quote block with skeleton while loading */}
                <div className="mt-2 w-full max-w-md rounded-2xl bg-white/90 px-5 py-4 text-sm shadow-lg ring-1 ring-blue-100/30">
                  {meditationQuote ? (
                    <>
                      <p className="italic leading-relaxed text-gray-700">
                        &quot;{meditationQuote}&quot;
                      </p>
                      {meditationAuthor && (
                        <p className="mt-3 text-xs text-gray-500">
                          — {meditationAuthor}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 w-full rounded bg-gradient-to-r from-sky-100 via-blue-100 to-sky-100" />
                      <div className="h-4 w-5/6 rounded bg-gradient-to-r from-sky-100 via-blue-100 to-sky-100" />
                      <div className="ml-auto h-3 w-1/3 rounded bg-gradient-to-r from-sky-100 via-blue-100 to-sky-100" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-4xl space-y-4 sm:space-y-6"
          >
            {/* Aggregator Parser Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAggregatorInput(!showAggregatorInput)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  disabled={isSubmitting || isParsingAggregator}
                >
                  <AggregatorIcon className="h-5 w-5" />
                  <span>Импорт из агрегатора</span>
                </button>
              </div>
              {showAggregatorInput && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aggregatorDataId}
                        onChange={e => setAggregatorDataId(e.target.value)}
                        placeholder="Введите data-id товара (например: 1119377)"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        disabled={isSubmitting || isParsingAggregator}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleAggregatorParse}
                        disabled={
                          isSubmitting ||
                          isParsingAggregator ||
                          !aggregatorDataId.trim()
                        }
                        className="!bg-gradient-to-r !from-blue-600 !to-blue-700 !text-white"
                      >
                        {isParsingAggregator ? 'Парсинг...' : 'Парсить'}
                      </Button>
                      {isDev && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAggregatorParseHtmlTest}
                          disabled={
                            isSubmitting ||
                            isParsingAggregator ||
                            !aggregatorDataId.trim()
                          }
                          className="!bg-gradient-to-r !from-yellow-500 !to-yellow-600 !text-white"
                          title="Тестовый режим: только парсинг HTML, без LLM и создания товара"
                        >
                          {isTestParsing ? 'Только HTML...' : 'Только HTML'}
                        </Button>
                      )}
                    </div>
                    {isDev && (
                      <div className="space-y-2">
                        <Text className="text-xs text-gray-500 dark:text-gray-400">
                          Режим отладки (только локально): вставьте сюда полный
                          HTML страницы товара с tk-sad.ru. Будет использован
                          прямой HTML, без Playwright.
                        </Text>
                        <textarea
                          value={aggregatorHtml}
                          onChange={e => setAggregatorHtml(e.target.value)}
                          className="resize-vertical mt-1 block h-40 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          placeholder="&lt;html&gt;...&lt;/html&gt;"
                          disabled={isSubmitting || isParsingAggregator}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAggregatorParseHtml}
                            disabled={
                              isSubmitting ||
                              isParsingAggregator ||
                              !aggregatorHtml.trim()
                            }
                          >
                            {isParsingAggregator
                              ? 'Анализ LLM...'
                              : 'Анализ LLM'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Images Section */}
            <ProductImageUpload
              images={images}
              onImagesChange={setImages}
              disabled={isSubmitting}
            />

            {/* Videos Section */}
            <ProductVideoUpload
              videos={videos}
              onVideosChange={setVideos}
              disabled={isSubmitting}
            />

            {/* Source Screenshot Section */}
            <div className="space-y-2">
              <Text
                variant="body"
                className="font-medium text-gray-900 dark:text-white"
              >
                Скриншот исходного сообщения (опционально)
              </Text>
              {!sourceScreenshotPreview ? (
                <ProductImageUploadArea
                  onFilesSelect={files => {
                    const file = files[0];
                    if (file) {
                      setSourceScreenshot(file);
                      const preview = URL.createObjectURL(file);
                      setSourceScreenshotPreview(preview);
                    }
                  }}
                  disabled={isSubmitting}
                  maxImages={1}
                  currentCount={0}
                />
              ) : (
                <div className="relative inline-block">
                  <Image
                    src={sourceScreenshotPreview}
                    alt="Source screenshot preview"
                    width={128}
                    height={128}
                    className="h-32 w-auto rounded-lg border object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (sourceScreenshotPreview) {
                        URL.revokeObjectURL(sourceScreenshotPreview);
                      }
                      setSourceScreenshot(null);
                      setSourceScreenshotPreview(null);
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg hover:bg-red-600"
                    disabled={isSubmitting}
                    title="Удалить скриншот"
                    aria-label="Удалить скриншот"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <CreateProductFormFields
              formData={formData}
              errors={errors}
              categories={categories}
              isSubmitting={isSubmitting}
              onFieldChange={handleFieldChange}
              onClearError={clearError}
            />

            {/* Error message */}
            {errors.submit && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {errors.submit}
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-4 py-4 sm:px-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto flex max-w-4xl flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
              className="w-full !bg-gradient-to-r !from-violet-600 !to-violet-700 !text-white sm:w-auto"
            >
              {isSubmitting ? 'Создание...' : 'Создать товар'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

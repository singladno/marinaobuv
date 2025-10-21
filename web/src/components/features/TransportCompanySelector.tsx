'use client';
import { useState, useEffect } from 'react';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  popularTransportCompanies,
  type TransportCompany,
} from '@/lib/shipping';

type Props = {
  value?: string | null;
  onChange?: (companyId: string, company: TransportCompany) => void;
  // If current selection is 'other', this prefills the custom name when reopening
  initialCustomName?: string;
};

export default function TransportCompanySelector({
  value,
  onChange,
  initialCustomName,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(value || null);
  const [otherName, setOtherName] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customCompanyName, setCustomCompanyName] = useState('');

  useEffect(() => {
    if (!value) return;
    setSelectedId(value);
  }, [value]);

  // Hydrate custom company name from parent when selection is 'other'
  useEffect(() => {
    if (value === 'other' && initialCustomName) {
      setCustomCompanyName(initialCustomName);
      setOtherName(initialCustomName);
    }
  }, [value, initialCustomName]);

  const select = (id: string) => {
    // Immediate visual update
    setSelectedId(id);

    if (id === 'other') {
      // If we have a custom name, show it in the input
      if (customCompanyName) {
        setOtherName(customCompanyName);
      }
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
      // Find company and call onChange immediately
      const company = popularTransportCompanies.find(c => c.id === id);
      if (company) {
        onChange?.(id, company);
      }
    }
  };

  const handleOtherSubmit = () => {
    const name = otherName.trim();
    if (!name) return;

    // Store the custom name
    setCustomCompanyName(name);

    const customCompany = {
      id: 'other',
      name,
      eta: '',
      priceLabel: '',
    };

    onChange?.('other', customCompany);
    setShowOtherInput(false);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {popularTransportCompanies.map(company => {
        const isActive = selectedId && company.id === selectedId;
        return (
          <button
            key={company.id}
            type="button"
            onClick={() => select(company.id)}
            className={`flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition-colors duration-150 ${
              isActive
                ? 'border-purple-500 ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center">
              {company.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-10 w-10 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
            <Text className="text-sm font-medium text-gray-900">
              {company.name}
            </Text>
          </button>
        );
      })}

      {/* Другое — компактная кнопка */}
      <button
        type="button"
        onClick={() => select('other')}
        className={`flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition-colors duration-150 ${
          selectedId === 'other'
            ? 'border-purple-500 ring-2 ring-purple-200'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center">
          {selectedId === 'other' && customCompanyName ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
              <svg
                className="h-4 w-4 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
          )}
        </div>
        <Text className="text-sm font-medium text-gray-900">
          {selectedId === 'other' && customCompanyName
            ? customCompanyName
            : 'Другое'}
        </Text>
      </button>

      {/* Модальное окно для ввода названия компании */}
      {showOtherInput && (
        <div className="fixed inset-0 z-[9999] grid min-h-screen place-content-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => {
              setShowOtherInput(false);
              // Don't clear otherName here, just close modal
            }}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Название транспортной компании
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Введите название транспортной компании
              </p>
            </div>

            <Input
              placeholder="Например: Курьерская служба XYZ"
              value={otherName}
              onChange={e => setOtherName(e.target.value)}
              className="w-full"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleOtherSubmit();
                } else if (e.key === 'Escape') {
                  setShowOtherInput(false);
                  // Don't clear otherName on escape, just close modal
                }
              }}
            />

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOtherInput(false);
                  // Don't clear otherName on cancel, just close modal
                }}
              >
                Отмена
              </Button>
              <Button onClick={handleOtherSubmit} disabled={!otherName.trim()}>
                Выбрать
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

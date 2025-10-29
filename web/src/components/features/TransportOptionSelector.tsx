'use client';
import { useState, useEffect } from 'react';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  popularTransportCompanies,
  type TransportCompany,
} from '@/lib/shipping';

export type TransportOption = {
  id: string;
  name: string;
  isSelected: boolean;
};

type Props = {
  selectedOptions: TransportOption[];
  onChange: (options: TransportOption[]) => void;
  initialCustomNames?: Record<string, string>;
};

export default function TransportOptionSelector({
  selectedOptions,
  onChange,
  initialCustomNames = {},
}: Props) {
  const [customNames, setCustomNames] =
    useState<Record<string, string>>(initialCustomNames);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherName, setOtherName] = useState('');

  const toggleOption = (companyId: string) => {
    const existingOption = selectedOptions.find(opt => opt.id === companyId);

    if (existingOption) {
      // Remove the option
      onChange(selectedOptions.filter(opt => opt.id !== companyId));
    } else {
      // Add the option
      const company = popularTransportCompanies.find(c => c.id === companyId);
      if (company) {
        const newOption: TransportOption = {
          id: companyId,
          name: company.name,
          isSelected: true,
        };
        onChange([...selectedOptions, newOption]);
      }
    }
  };

  const handleOtherSubmit = () => {
    const name = otherName.trim();
    if (!name) return;

    const customId = `custom_${Date.now()}`;
    const newOption: TransportOption = {
      id: customId,
      name,
      isSelected: true,
    };

    setCustomNames(prev => ({ ...prev, [customId]: name }));
    onChange([...selectedOptions, newOption]);
    setOtherName('');
    setShowOtherInput(false);
  };

  const removeCustomOption = (optionId: string) => {
    onChange(selectedOptions.filter(opt => opt.id !== optionId));
    setCustomNames(prev => {
      const newNames = { ...prev };
      delete newNames[optionId];
      return newNames;
    });
  };

  return (
    <div className="space-y-4">
      {/* Selected options display */}
      {selectedOptions.length > 0 && (
        <div className="space-y-2">
          <Text className="text-sm font-medium text-gray-700">
            Выбранные транспортные компании:
          </Text>
          <div className="flex flex-wrap gap-2">
            {selectedOptions.map(option => (
              <div
                key={option.id}
                className="flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-2"
              >
                <Text className="text-sm font-medium text-purple-800">
                  {option.name}
                </Text>
                <button
                  type="button"
                  onClick={() => removeCustomOption(option.id)}
                  className="cursor-pointer text-purple-600 hover:text-purple-800"
                  title={`Удалить ${option.name}`}
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
            ))}
          </div>
        </div>
      )}

      {/* Transport company grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {popularTransportCompanies.map(company => {
          const isSelected = selectedOptions.some(opt => opt.id === company.id);
          return (
            <button
              key={company.id}
              type="button"
              onClick={() => toggleOption(company.id)}
              className={`flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition-colors duration-150 ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
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
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500">
                    <svg
                      className="h-3 w-3 text-white"
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
                </div>
              )}
            </button>
          );
        })}

        {/* Custom option button */}
        <button
          type="button"
          onClick={() => setShowOtherInput(true)}
          className="flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 p-3 text-center transition-colors duration-150 hover:border-gray-300"
        >
          <div className="flex h-10 w-10 items-center justify-center">
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
          </div>
          <Text className="text-sm font-medium text-gray-900">Другое</Text>
        </button>
      </div>

      {/* Custom company input modal */}
      {showOtherInput && (
        <div className="fixed inset-0 z-[9999] grid min-h-screen place-content-center p-4">
          <div
            className="absolute inset-0 cursor-pointer bg-black/20"
            onClick={() => setShowOtherInput(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Добавить транспортную компанию
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
                }
              }}
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowOtherInput(false)}
              >
                Отмена
              </Button>
              <Button onClick={handleOtherSubmit} disabled={!otherName.trim()}>
                Добавить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

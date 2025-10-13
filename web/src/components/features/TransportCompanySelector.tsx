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
};

export default function TransportCompanySelector({ value, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string>(
    value || popularTransportCompanies[0].id
  );
  const [otherName, setOtherName] = useState('');

  useEffect(() => {
    if (!value) return;
    setSelectedId(value);
  }, [value]);

  const select = (id: string) => {
    setSelectedId(id);
    const company = popularTransportCompanies.find(c => c.id === id)!;
    onChange?.(id, company);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {popularTransportCompanies.map(company => {
        const isActive = company.id === selectedId;
        return (
          <button
            key={company.id}
            type="button"
            onClick={() => select(company.id)}
            className={`flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border p-3 text-center transition-all ${
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

      {/* Другое — объединённый раскрывающийся блок */}
      <div
        className={`relative w-full rounded-lg border p-4 transition-all ${
          selectedId === 'other'
            ? 'border-purple-500 ring-2 ring-purple-200'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => {
          if (selectedId !== 'other') setSelectedId('other');
        }}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' && selectedId !== 'other')
            setSelectedId('other');
        }}
      >
        {/* Свернутое состояние */}
        <div
          className={`flex h-24 items-center justify-center transition-opacity duration-200 ${
            selectedId === 'other'
              ? 'pointer-events-none opacity-0'
              : 'opacity-100'
          }`}
        >
          <Text className="text-base font-medium text-gray-900">Другое</Text>
        </div>

        {/* Развернутое состояние */}
        <div
          className={`transition-all duration-200 ${
            selectedId === 'other'
              ? 'opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Название транспортной компании
          </label>
          <Input
            placeholder="Например: Курьерская служба XYZ"
            value={otherName}
            onChange={e => {
              const name = e.target.value;
              setOtherName(name);
              onChange?.('other', {
                id: 'other',
                name: name || 'Другая компания',
                eta: '',
                priceLabel: '',
              });
            }}
            className="w-full"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const name = otherName.trim();
                if (name) {
                  onChange?.('other', {
                    id: 'other',
                    name,
                    eta: '',
                    priceLabel: '',
                  });
                }
              }
            }}
          />
          <div className="mt-3 flex justify-end">
            <Button
              onClick={() => {
                const name = otherName.trim();
                if (!name) return;
                onChange?.('other', {
                  id: 'other',
                  name,
                  eta: '',
                  priceLabel: '',
                });
              }}
              disabled={!otherName.trim()}
            >
              Выбрать
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

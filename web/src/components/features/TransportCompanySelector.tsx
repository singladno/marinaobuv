'use client';
import { useState, useEffect } from 'react';

import { Text } from '@/components/ui/Text';
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
    <div className="space-y-3">
      {popularTransportCompanies.map(company => {
        const isActive = company.id === selectedId;
        return (
          <button
            key={company.id}
            type="button"
            onClick={() => select(company.id)}
            className={`w-full rounded-lg border p-4 text-left transition-all ${
              isActive
                ? 'border-purple-500 ring-2 ring-purple-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <Text className="font-medium text-gray-900">
                  {company.name}
                </Text>
                {company.address && (
                  <p className="text-sm text-gray-600">{company.address}</p>
                )}
                {company.workingHours && (
                  <p className="text-sm text-gray-500">
                    {company.workingHours}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">
                  {company.priceLabel}
                </p>
                <p className="text-sm text-gray-500">{company.eta}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

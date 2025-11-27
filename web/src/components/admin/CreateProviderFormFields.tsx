'use client';

import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';

interface CreateProviderFormFieldsProps {
  formData: {
    name: string;
    phone: string;
    place: string;
  };
  updateField: (field: 'name' | 'phone' | 'place', value: string) => void;
  isSubmitting: boolean;
}

export function CreateProviderFormFields({
  formData,
  updateField,
  isSubmitting,
}: CreateProviderFormFieldsProps) {
  return (
    <>
      <div className="space-y-3">
        <Text
          variant="body"
          className="font-medium text-gray-900 dark:text-white"
        >
          Имя <span className="text-red-500">*</span>
        </Text>
        <Input
          type="text"
          value={formData.name}
          onChange={e => updateField('name', e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          placeholder="Введите имя поставщика..."
          disabled={isSubmitting}
          required
          autoFocus
          fullWidth
        />
      </div>

      <div className="space-y-3">
        <Text
          variant="body"
          className="font-medium text-gray-900 dark:text-white"
        >
          Телефон
        </Text>
        <Input
          type="tel"
          value={formData.phone}
          onChange={e => updateField('phone', e.target.value)}
          placeholder="Введите телефон..."
          disabled={isSubmitting}
          fullWidth
        />
      </div>

      <div className="space-y-3">
        <Text
          variant="body"
          className="font-medium text-gray-900 dark:text-white"
        >
          Место
        </Text>
        <Input
          type="text"
          value={formData.place}
          onChange={e => updateField('place', e.target.value)}
          placeholder="Введите место поставщика..."
          disabled={isSubmitting}
          fullWidth
        />
      </div>
    </>
  );
}

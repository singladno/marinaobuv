'use client';

import { useState } from 'react';

interface CreateProviderFormData {
  name: string;
  phone: string;
  place: string;
}

export function useCreateProviderForm() {
  const [formData, setFormData] = useState<CreateProviderFormData>({
    name: '',
    phone: '',
    place: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof CreateProviderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const reset = () => {
    setFormData({ name: '', phone: '', place: '' });
    setError(null);
    setIsSubmitting(false);
  };

  const submit = async (
    onCreate: (provider: { name: string; phone?: string; place?: string }) => Promise<void>
  ) => {
    if (!formData.name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        place: formData.place.trim() || undefined,
      });
      reset();
    } catch (error: any) {
      console.error('Error creating provider:', error);
      setError(error?.message || 'Не удалось создать поставщика');
      setIsSubmitting(false);
      throw error;
    }
  };

  return {
    formData,
    isSubmitting,
    error,
    updateField,
    reset,
    submit,
  };
}

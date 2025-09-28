'use client';

import React, { useState, useEffect } from 'react';

import { formatPhoneNumber, getCleanPhoneNumber } from '@/utils/phoneMask';

import { Input } from './Input';

interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value'
  > {
  value: string;
  onChange: (value: string) => void;
  onCleanChange?: (cleanValue: string) => void;
}

export function PhoneInput({
  value,
  onChange,
  onCleanChange,
  className,
  ...props
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const formatted = formatPhoneNumber(value);
    setDisplayValue(formatted);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    const cleanValue = getCleanPhoneNumber(inputValue);

    setDisplayValue(formatted);
    onChange(formatted);

    if (onCleanChange) {
      onCleanChange(cleanValue);
    }
  };

  return (
    <Input
      {...props}
      type="tel"
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder="+7 (999) 123-45-67"
    />
  );
}

export default PhoneInput;

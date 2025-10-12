'use client';

import clsx from 'clsx';
import React from 'react';

type Props = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  name?: string;
  value?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'>;

export function Radio({
  className,
  onCheckedChange,
  onChange,
  ...rest
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <input
      type="radio"
      className={clsx(
        'h-6 w-6 cursor-pointer appearance-none rounded-full border-2 transition-colors duration-150',
        'border-gray-300 bg-white checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400',
        'focus:outline-none focus:ring-2 focus:ring-purple-300',
        'disabled:cursor-not-allowed disabled:opacity-50',
        "checked:bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><circle cx='10' cy='10' r='4' fill='%23fff'/></svg>\")]",
        'bg-[length:8px] bg-center bg-no-repeat',
        className
      )}
      onChange={handleChange}
      {...rest}
    />
  );
}

export default Radio;

'use client';

import clsx from 'clsx';
import React from 'react';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({
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
      type="checkbox"
      className={clsx(
        'border-border text-primary focus:ring-primary/30 h-4 w-4 rounded focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onChange={handleChange}
      {...rest}
    />
  );
}

export default Checkbox;

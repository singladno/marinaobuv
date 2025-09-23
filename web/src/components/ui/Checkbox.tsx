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
        'h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 transition-colors duration-150',
        'border-gray-300 bg-white checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400',
        'focus:outline-none focus:ring-2 focus:ring-purple-300',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onChange={handleChange}
      {...rest}
      style={{
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 20 20\\'><path fill=\\'%23fff\\' d=\\'M8.143 13.314L4.829 10l-1.257 1.257 4.571 4.571 8.286-8.286L15.171 6l-7.028 7.314z\\'/></svg>')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '14px',
      }}
    />
  );
}

export default Checkbox;

import clsx from 'clsx';
import React from 'react';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  fullWidth?: boolean;
};

export function Select({ className, fullWidth, children, ...rest }: Props) {
  return (
    <select
      className={clsx(
        'rounded border border-border bg-background px-3 py-2 text-sm outline-none',
        'focus:ring-2 focus:ring-primary/30',
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export default Select;


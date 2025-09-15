import clsx from 'clsx';
import React from 'react';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  fullWidth?: boolean;
};

export function Select({ className, fullWidth, children, ...rest }: Props) {
  return (
    <select
      className={clsx(
        'border-border bg-background shadow-xs rounded-md border px-3 py-2 text-sm outline-none',
        'focus-visible:ring-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export default Select;

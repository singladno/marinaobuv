import clsx from 'clsx';
import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
};

export function Input({ className, fullWidth, ...rest }: Props) {
  return (
    <input
      className={clsx(
        'border-border bg-background shadow-xs rounded-md border px-3 py-2 text-sm outline-none',
        'placeholder:text-muted',
        'focus-visible:ring-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    />
  );
}

export default Input;

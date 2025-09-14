import clsx from 'clsx';
import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
};

export function Input({ className, fullWidth, ...rest }: Props) {
  return (
    <input
      className={clsx(
        'rounded border border-border bg-background px-3 py-2 text-sm outline-none',
        'focus:ring-2 focus:ring-primary/30',
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    />
  );
}

export default Input;


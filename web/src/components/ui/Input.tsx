import clsx from 'clsx';
import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ className, fullWidth, ...rest }, ref) => {
    return (
      <input
        ref={ref}
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
);

Input.displayName = 'Input';

export default Input;

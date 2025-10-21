import clsx from 'clsx';
import React from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fullWidth?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ className, fullWidth, ...rest }, ref) => {
    return (
      <textarea
        ref={ref}
        className={clsx(
          // Base: single subtle border, no inner shadow
          'bg-background rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-none outline-none',
          'placeholder:text-muted',
          // Focus: match selectable option style (purple border + soft ring)
          'focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:ring-offset-0',
          fullWidth && 'w-full',
          className
        )}
        {...rest}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;

import clsx from 'clsx';
import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className, hover = false, ...rest }: Props) {
  return (
    <div
      className={clsx(
        'rounded border border-border bg-surface shadow-sm',
        hover && 'transition hover:shadow-md',
        className,
      )}
      {...rest}
    />
  );
}

export default Card;

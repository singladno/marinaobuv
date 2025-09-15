import clsx from 'clsx';
import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className, hover = false, ...rest }: Props) {
  return (
    <div
      className={clsx(
        'border-border bg-surface rounded-xl border shadow-sm',
        hover && 'transition hover:-translate-y-[1px] hover:shadow-md',
        className
      )}
      {...rest}
    />
  );
}

export default Card;

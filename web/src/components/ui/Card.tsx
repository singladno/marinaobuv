import clsx from 'clsx';
import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className, hover = false, ...rest }: Props) {
  return (
    <div
      className={clsx(
        'bg-surface rounded-xl shadow-sm transition-all',
        hover &&
          'hover:ring-foreground/10 cursor-pointer hover:-translate-y-[2px] hover:shadow-md hover:ring-1',
        className
      )}
      {...rest}
    />
  );
}

export default Card;

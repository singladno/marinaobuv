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

export function CardHeader({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('flex flex-col space-y-1.5 p-6', className)}
      {...rest}
    />
  );
}

export function CardContent({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('p-6 pt-0', className)} {...rest} />;
}

export default Card;

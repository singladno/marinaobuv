import clsx from 'clsx';
import React from 'react';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

const base =
  'inline-flex items-center rounded-full font-medium transition-colors';
const variants: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'border border-border text-foreground',
};
const sizes: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
}: BadgeProps) {
  return (
    <span className={clsx(base, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

export default Badge;

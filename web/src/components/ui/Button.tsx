import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';

type Variant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'subtle'
  | 'ghost'
  | 'success'
  | 'danger'
  | 'warning';
type Size = 'sm' | 'md' | 'lg' | 'icon';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  asChild?: boolean;
};

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
type AnchorProps = CommonProps & { href: string };

const base =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md transition outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-50 disabled:pointer-events-none';
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5',
  icon: 'h-9 w-9 p-0',
};
const variants: Record<Variant, string> = {
  // Unified brand color: violet gradient
  primary:
    'bg-gradient-to-r from-violet-600 to-violet-700 !text-white shadow-lg hover:from-violet-700 hover:to-violet-800 hover:shadow-xl transition-all duration-200',
  secondary:
    'bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50',
  outline:
    'bg-transparent text-gray-900 border border-gray-300 hover:bg-gray-50',
  subtle: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
  ghost: 'bg-transparent text-gray-900 hover:bg-gray-50',
  success: 'bg-green-600 !text-white shadow-sm hover:bg-green-700',
  danger: 'bg-red-600 !text-white shadow-sm hover:bg-red-700',
  warning: 'bg-yellow-600 !text-white shadow-sm hover:bg-yellow-700',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  asChild = false,
  ...rest
}: ButtonProps) {
  const buttonClasses = clsx(base, variants[variant], sizes[size], className);

  if (asChild && React.isValidElement(children)) {
    const c = children as React.ReactElement<any>;
    return React.cloneElement(c, {
      className: clsx(buttonClasses, c.props?.className),
    });
  }

  return (
    <button className={buttonClasses} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  href,
}: AnchorProps) {
  return (
    <Link
      href={href}
      className={clsx(base, variants[variant], sizes[size], className)}
    >
      {children}
    </Link>
  );
}

export default Button;

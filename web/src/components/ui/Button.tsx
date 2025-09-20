import clsx from 'clsx';
import Link from 'next/link';
import React from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'subtle' | 'ghost';
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
  'inline-flex items-center justify-center gap-1.5 rounded-md transition outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-50 disabled:pointer-events-none';
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5',
  icon: 'h-9 w-9 p-0',
};
const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-sm hover:bg-[color-mix(in_oklab,var(--color-primary),#000_10%)]',
  secondary:
    'bg-surface text-foreground border border-border shadow-sm hover:bg-[color-mix(in_oklab,var(--color-background),#000_3%)]',
  outline:
    'bg-transparent text-foreground border border-border hover:bg-[color-mix(in_oklab,var(--color-background),#000_4%)]',
  subtle:
    'bg-[color-mix(in_oklab,var(--color-primary),transparent_85%)] text-[color-mix(in_oklab,var(--color-primary),#000_20%)] hover:bg-[color-mix(in_oklab,var(--color-primary),transparent_78%)]',
  ghost: 'bg-transparent text-foreground hover-elevate',
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
    return React.cloneElement(children, {
      className: clsx(buttonClasses, children.props.className),
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

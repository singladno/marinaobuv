import clsx from 'clsx';
import React from 'react';
type Variant = 'h1' | 'h2' | 'h3' | 'lead' | 'body' | 'caption' | 'overline';
type Tone = 'default' | 'muted' | 'inverted' | 'primary';

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  variant?: Variant;
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
};

const variantMap: Record<Variant, string> = {
  h1: 'text-3xl sm:text-4xl font-semibold tracking-tight',
  h2: 'text-2xl sm:text-3xl font-semibold tracking-tight',
  h3: 'text-xl sm:text-2xl font-semibold',
  lead: 'text-lg text-muted',
  body: 'text-base',
  caption: 'text-sm text-muted',
  overline: 'text-xs uppercase tracking-wider text-muted',
};

const toneMap: Record<Tone, string> = {
  // default tone does not force a color, allowing parent to control text color (better for buttons)
  default: '',
  muted: 'text-muted',
  inverted: 'text-white',
  primary: 'text-primary',
};

export function Text({
  as,
  variant = 'body',
  tone = 'default',
  className,
  children,
  ...rest
}: Props) {
  const Tag: React.ElementType =
    as ?? (variant.startsWith('h') ? (variant as 'h1' | 'h2' | 'h3') : 'p');
  return React.createElement(
    Tag,
    { className: clsx(variantMap[variant], toneMap[tone], className), ...rest },
    children
  );
}

export default Text;

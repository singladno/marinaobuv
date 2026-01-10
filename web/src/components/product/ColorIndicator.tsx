'use client';

import { getColorHex } from '@/utils/colorMapping';

type Props = {
  colorName: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/**
 * Check if a color name represents a multicolor/rainbow color
 * Exported for use in other components
 */
export function isMulticolor(colorName: string | null | undefined): boolean {
  if (!colorName) return false;
  const normalized = colorName.toLowerCase().trim();
  return (
    normalized.includes('многоцветн') ||
    normalized.includes('разноцветн') ||
    normalized.includes('multicolor')
  );
}

/**
 * Reusable color indicator component
 * Shows a rainbow gradient for multicolor/rainbow colors
 * Shows a solid color for regular colors
 */
export default function ColorIndicator({
  colorName,
  size = 'md',
  className = '',
}: Props) {
  const isRainbow = isMulticolor(colorName);
  const colorHex = getColorHex(colorName);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  const baseClasses = `block rounded-full ${sizeClasses[size]} ${className}`;

  if (isRainbow) {
    // Light, bright rainbow gradient for multicolor (red, orange, yellow, green, cyan)
    return (
      <span
        aria-hidden
        className={baseClasses}
        style={{
          background:
            'linear-gradient(90deg, #FF6B6B 0%, #FFA500 25%, #FFD700 50%, #90EE90 75%, #87CEEB 100%)',
        }}
      />
    );
  }

  // Regular solid color
  return (
    <span
      aria-hidden
      className={baseClasses}
      style={{ backgroundColor: colorHex }}
    />
  );
}

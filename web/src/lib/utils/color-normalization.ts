/**
 * Utility functions for normalizing color names to consistent lowercase format
 */

/**
 * Normalize color names to lowercase format
 * Simply converts to lowercase without any mapping - saves LLM responses directly
 */
export function normalizeColorToRussian(color: string | null): string | null {
  if (!color) return null;

  // Simply return lowercase version - no mapping, save LLM responses directly
  return color.toLowerCase().trim();
}

/**
 * @deprecated Use normalizeColorToRussian instead - now just converts to lowercase
 */
export function normalizeColorToLowercase(color: string | null): string | null {
  return normalizeColorToRussian(color);
}

/**
 * Normalize an array of colors to Russian lowercase
 */
export function normalizeColorsToRussian(colors: (string | null)[]): string[] {
  return colors
    .map(color => normalizeColorToRussian(color))
    .filter((color): color is string => color !== null);
}

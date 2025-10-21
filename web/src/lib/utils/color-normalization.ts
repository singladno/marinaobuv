/**
 * Utility functions for normalizing color names to consistent lowercase format
 */

/**
 * English to Russian color mapping
 */
const ENGLISH_TO_RUSSIAN_COLOR_MAP: Record<string, string> = {
  // Basic colors
  black: 'черный',
  white: 'белый',
  red: 'красный',
  green: 'зеленый',
  blue: 'синий',
  yellow: 'желтый',
  orange: 'оранжевый',
  purple: 'фиолетовый',
  pink: 'розовый',
  brown: 'коричневый',
  gray: 'серый',
  grey: 'серый',

  // Beige variations
  beige: 'бежевый',
  tan: 'бежевый',
  cream: 'кремовый',
  ivory: 'слоновая кость',

  // Blue variations
  navy: 'темно-синий',
  'navy blue': 'темно-синий',
  'light blue': 'светло-синий',
  'sky blue': 'голубой',
  'royal blue': 'королевский синий',
  cobalt: 'кобальтовый',
  turquoise: 'бирюзовый',
  teal: 'сине-зеленый',

  // Red variations
  'dark red': 'темно-красный',
  'light red': 'светло-красный',
  crimson: 'малиновый',
  maroon: 'бордовый',
  burgundy: 'бордовый',
  scarlet: 'алый',

  // Green variations
  'dark green': 'темно-зеленый',
  'light green': 'светло-зеленый',
  lime: 'лайм',
  olive: 'оливковый',
  emerald: 'изумрудный',
  'forest green': 'лесной зеленый',

  // Yellow variations
  gold: 'золотой',
  golden: 'золотистый',
  lemon: 'лимонный',
  mustard: 'горчичный',
  amber: 'янтарный',

  // Purple variations
  violet: 'фиолетовый',
  lavender: 'лавандовый',
  plum: 'сливовый',
  magenta: 'пурпурный',

  // Pink variations
  rose: 'розовый',
  coral: 'коралловый',
  salmon: 'лососевый',
  peach: 'персиковый',

  // Brown variations
  'dark brown': 'темно-коричневый',
  'light brown': 'светло-коричневый',
  chocolate: 'шоколадный',
  coffee: 'кофейный',
  caramel: 'карамельный',
  bronze: 'бронзовый',
  copper: 'медный',

  // Gray variations
  'dark gray': 'темно-серый',
  'dark grey': 'темно-серый',
  'light gray': 'светло-серый',
  'light grey': 'светло-серый',
  silver: 'серебряный',
  charcoal: 'угольный',
  slate: 'сланцевый',

  // Other colors
  transparent: 'прозрачный',
  metallic: 'металлик',
  shiny: 'блестящий',
  matte: 'матовый',
};

/**
 * Normalize color names to Russian lowercase format
 * Maps English color names to Russian equivalents, then converts to lowercase
 */
export function normalizeColorToRussian(color: string | null): string | null {
  if (!color) return null;

  const trimmedColor = color.toLowerCase().trim();

  // Check if we have a direct mapping
  const russianColor = ENGLISH_TO_RUSSIAN_COLOR_MAP[trimmedColor];

  if (russianColor) {
    return russianColor;
  }

  // If no mapping found, return the original color in lowercase
  // This handles cases where the color is already in Russian or other languages
  return trimmedColor;
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

/**
 * Get all available Russian color names
 */
export function getAvailableRussianColors(): string[] {
  return Object.values(ENGLISH_TO_RUSSIAN_COLOR_MAP);
}

/**
 * Check if a color name is in English and can be mapped to Russian
 */
export function isEnglishColor(color: string): boolean {
  return color.toLowerCase().trim() in ENGLISH_TO_RUSSIAN_COLOR_MAP;
}

/**
 * Standardized color list for the system
 * Based on the most used colors in the database
 * Users can only select from this list when specifying product colors
 */

export const STANDARD_COLORS = [
  'черный',
  'белый',
  'бежевый',
  'коричневый',
  'серый',
  'синий',
  'зеленый',
  'розовый',
  'красный',
  'голубой',
  'желтый',
  'бордовый',
  'фиолетовый',
  'серебристый',
  'оливковый',
  'оранжевый',
  'камуфляжный',
  'золотой',
  'бирюзовый',
  'разноцветный',
] as const;

export type StandardColor = (typeof STANDARD_COLORS)[number];

/**
 * Color normalization map - maps variations and compound colors to standard colors
 */
const COLOR_NORMALIZATION_MAP: Record<string, StandardColor> = {
  // Basic colors - direct mappings
  черный: 'черный',
  чёрный: 'черный',
  black: 'черный',

  белый: 'белый',
  white: 'белый',

  бежевый: 'бежевый',
  beige: 'бежевый',
  телесный: 'бежевый',

  коричневый: 'коричневый',
  brown: 'коричневый',

  серый: 'серый',
  grey: 'серый',
  gray: 'серый',

  синий: 'синий',
  blue: 'синий',

  зеленый: 'зеленый',
  зелёный: 'зеленый',
  green: 'зеленый',

  розовый: 'розовый',
  pink: 'розовый',

  красный: 'красный',
  red: 'красный',

  голубой: 'голубой',
  'light blue': 'голубой',
  'sky blue': 'голубой',

  желтый: 'желтый',
  жёлтый: 'желтый',
  yellow: 'желтый',

  бордовый: 'бордовый',
  burgundy: 'бордовый',
  maroon: 'бордовый',
  малиновый: 'бордовый',

  фиолетовый: 'фиолетовый',
  purple: 'фиолетовый',
  violet: 'фиолетовый',
  сиреневый: 'фиолетовый',
  лавандовый: 'фиолетовый',

  серебристый: 'серебристый',
  серебряный: 'серебристый',
  silver: 'серебристый',

  оливковый: 'оливковый',
  olive: 'оливковый',

  оранжевый: 'оранжевый',
  orange: 'оранжевый',

  камуфляжный: 'камуфляжный',
  камуфляж: 'камуфляжный',
  camouflage: 'камуфляжный',

  золотой: 'золотой',
  gold: 'золотой',
  golden: 'золотой',

  бирюзовый: 'бирюзовый',
  turquoise: 'бирюзовый',
  teal: 'бирюзовый',

  // Multi-color variations
  разноцветный: 'разноцветный',
  разноцветные: 'разноцветный',
  многоцветный: 'разноцветный',
  многоцветные: 'разноцветный',
  multicolor: 'разноцветный',
  multicolored: 'разноцветный',

  // Other variations
  коралловый: 'розовый',
  coral: 'розовый',
  лососевый: 'розовый',
  salmon: 'розовый',
};

/**
 * Extract main color from compound colors like "синий с желтым" -> "синий"
 */
function extractMainColor(color: string): string {
  const normalized = color.toLowerCase().trim();

  // Remove compound colors - take only the first color before "с", "и", "с/", etc.
  const compoundPatterns = [
    /\s+с\s+/i, // "синий с желтым"
    /\s+и\s+/i, // "синий и желтый"
    /\s+\/\s+/i, // "синий/желтый"
    /\s+,\s+/i, // "синий, желтый"
    /\s+плюс\s+/i, // "синий плюс желтый"
  ];

  for (const pattern of compoundPatterns) {
    if (pattern.test(normalized)) {
      const parts = normalized.split(pattern);
      if (parts.length > 0 && parts[0].trim()) {
        return parts[0].trim();
      }
    }
  }

  return normalized;
}

/**
 * Normalize a color to one of the standard colors
 * Returns null if the color cannot be normalized to a standard color
 */
export function normalizeToStandardColor(
  color: string | null | undefined
): StandardColor | null {
  if (!color) return null;

  // Extract main color from compound colors
  const mainColor = extractMainColor(color);
  const normalized = mainColor.toLowerCase().trim();

  // Remove common prefixes/suffixes
  const cleaned = normalized
    .replace(/^цвет:\s*/i, '')
    .replace(/\s*цвет$/i, '')
    .replace(/^цвета:\s*/i, '')
    .trim();

  // Check direct mapping first
  if (cleaned in COLOR_NORMALIZATION_MAP) {
    return COLOR_NORMALIZATION_MAP[cleaned];
  }

  // Try partial matching for variations
  for (const [key, value] of Object.entries(COLOR_NORMALIZATION_MAP)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return value;
    }
  }

  // If no match found, return null (color should be rejected)
  return null;
}

/**
 * Check if a color is a valid standard color
 */
export function isValidStandardColor(
  color: string | null | undefined
): color is StandardColor {
  if (!color) return false;
  return STANDARD_COLORS.includes(color.toLowerCase().trim() as StandardColor);
}

/**
 * Get all standard colors as an array
 */
export function getStandardColors(): readonly StandardColor[] {
  return STANDARD_COLORS;
}

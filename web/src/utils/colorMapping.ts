/**
 * Centralized color mapping utility
 * Maps Russian color names to hex color codes
 * Used across the application for consistent color display
 */

export const COLOR_MAP: Record<string, string> = {
  // Basic colors - Russian
  черный: '#000000',
  чёрный: '#000000',
  белый: '#FFFFFF',
  красный: '#EF4444',
  синий: '#3B82F6',
  зеленый: '#10B981',
  зелёный: '#10B981',
  желтый: '#FFEB3B',
  жёлтый: '#FFEB3B',
  оранжевый: '#F97316',
  розовый: '#EC4899',
  фиолетовый: '#8B5CF6',
  коричневый: '#92400E',
  серый: '#9CA3AF',
  бежевый: '#D2B48C',

  // Blue variations - Russian
  голубой: '#60A5FA',
  'темно-синий': '#1E3A8A',
  'тёмно-синий': '#1E3A8A',
  'светло-синий': '#93C5FD',
  бирюзовый: '#14B8A6',
  'сине-зеленый': '#14B8A6',

  // Red variations - Russian
  'темно-красный': '#DC2626',
  'тёмно-красный': '#DC2626',
  'светло-красный': '#F87171',
  малиновый: '#E11D48',
  бордовый: '#7F1D1D',
  алый: '#EF4444',

  // Green variations - Russian
  'темно-зеленый': '#059669',
  'темно зеленый': '#059669',
  'тёмно-зеленый': '#059669',
  'тёмно зеленый': '#059669',
  'светло-зеленый': '#34D399',
  'светло зеленый': '#34D399',
  оливковый: '#84CC16',
  изумрудный: '#10B981',
  'лесной зеленый': '#047857',

  // Yellow variations - Russian
  золотой: '#F59E0B',
  золотистый: '#F59E0B',
  лимонный: '#FCD34D',
  горчичный: '#D97706',
  янтарный: '#F59E0B',

  // Purple variations - Russian
  лавандовый: '#A78BFA',
  сливовый: '#7C3AED',
  пурпурный: '#C026D3',

  // Pink variations - Russian
  коралловый: '#FB7185',
  лососевый: '#FDA4AF',
  персиковый: '#FED7AA',

  // Brown variations - Russian
  'темно-коричневый': '#78350F',
  'тёмно-коричневый': '#78350F',
  'светло-коричневый': '#D97706',

  // Beige/Cream variations - Russian
  кремовый: '#FEF3C7',
  'слоновая кость': '#FFFBEB',
  молочный: '#F8FAFC',

  // Other colors - Russian
  хаки: '#8A9A5B',
  небесный: '#60A5FA',
  'темно-серый': '#4B5563',
  'темно серый': '#4B5563',
  'тёмно-серый': '#4B5563',
  'тёмно серый': '#4B5563',
  серебристый: '#C0C0C0',
  серебряный: '#C0C0C0',
  камуфляж: '#556B2F',
  камуфляжный: '#556B2F',
  многоцветный: '#9333EA',
  разноцветный: '#9333EA',
  'белый с бордовым': '#FFFFFF',
  'белый/черный': '#000000',
  'черно-белый': '#000000',
  'черно белый': '#000000',
  'черный/белый': '#000000',
  'черный белый': '#000000',

  // Patterns and combinations
  'black, leopard': '#000000',
  'black/leopard': '#000000',
  multicolor: '#9333EA',

  // English variants (for compatibility)
  black: '#000000',
  white: '#FFFFFF',
  gray: '#9CA3AF',
  grey: '#9CA3AF',
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#FFEB3B',
  orange: '#F97316',
  brown: '#92400E',
  beige: '#D2B48C',
  pink: '#EC4899',
  purple: '#8B5CF6',
  violet: '#8B5CF6',
  navy: '#1E3A8A',
  tan: '#D2B48C',
  turquoise: '#14B8A6',
  teal: '#14B8A6',
  olive: '#84CC16',
  gold: '#F59E0B',
  silver: '#C0C0C0',
  coral: '#FB7185',
  salmon: '#FDA4AF',
  peach: '#FED7AA',
  lavender: '#A78BFA',
  plum: '#7C3AED',
  magenta: '#C026D3',
  maroon: '#7F1D1D',
  burgundy: '#7F1D1D',
  crimson: '#E11D48',
  emerald: '#10B981',
  lime: '#84CC16',
  khaki: '#8A9A5B',
  cream: '#FEF3C7',
  ivory: '#FFFBEB',
  'dark gray': '#4B5563',
  'dark grey': '#4B5563',
  'dark green': '#059669',
  camouflage: '#556B2F',
};

/**
 * Normalize color name for lookup
 * Handles variations in spelling, case, and whitespace
 */
function normalizeColorName(colorName: string | null | undefined): string {
  if (!colorName) return '';

  return colorName
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е') // Replace ё with е
    .replace(/[_\-]/g, ' ') // Replace underscores and hyphens with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Get hex color code for a color name
 * Returns a default gray if color not found
 */
export function getColorHex(colorName: string | null | undefined): string {
  if (!colorName) return '#D1D5DB'; // Default gray

  const normalized = normalizeColorName(colorName);

  // Direct lookup
  if (normalized in COLOR_MAP) {
    return COLOR_MAP[normalized];
  }

  // Try to find partial matches for compound colors
  // e.g., "темно-синий" might be stored as "темно синий"
  const variations = [
    normalized,
    normalized.replace(/\s+/g, '-'),
    normalized.replace(/-/g, ' '),
  ];

  for (const variant of variations) {
    if (variant in COLOR_MAP) {
      return COLOR_MAP[variant];
    }
  }

  // Heuristic matching for common patterns
  if (normalized.includes('темно') || normalized.includes('тёмно') || normalized.includes('dark')) {
    if (normalized.includes('син') || normalized.includes('blue')) return '#1E3A8A';
    if (normalized.includes('красн') || normalized.includes('red')) return '#DC2626';
    if (normalized.includes('зелен') || normalized.includes('green')) return '#059669';
    if (normalized.includes('коричнев') || normalized.includes('brown')) return '#78350F';
    if (normalized.includes('сер') || normalized.includes('gray') || normalized.includes('grey')) return '#4B5563';
  }

  if (normalized.includes('светло') || normalized.includes('light')) {
    if (normalized.includes('син') || normalized.includes('blue')) return '#93C5FD';
    if (normalized.includes('красн') || normalized.includes('red')) return '#F87171';
    if (normalized.includes('зелен') || normalized.includes('green')) return '#34D399';
    if (normalized.includes('коричнев') || normalized.includes('brown')) return '#D97706';
  }

  if (normalized.includes('голуб') || normalized.includes('sky') || normalized.includes('небесн')) {
    return '#60A5FA';
  }

  if (normalized.includes('бирюз') || normalized.includes('turquoise')) {
    return '#14B8A6';
  }

  // Handle black/white combinations
  if (normalized.includes('черн') && normalized.includes('бел')) {
    return '#000000';
  }
  if (normalized.includes('black') && normalized.includes('white')) {
    return '#000000';
  }

  // Handle multicolor variations
  if (normalized.includes('многоцветн') || normalized.includes('разноцветн') || normalized.includes('multicolor')) {
    return '#9333EA';
  }

  // Default fallback
  return '#D1D5DB';
}

/**
 * Check if a color name has a mapping
 */
export function hasColorMapping(colorName: string | null | undefined): boolean {
  if (!colorName) return false;
  const normalized = normalizeColorName(colorName);
  return normalized in COLOR_MAP;
}

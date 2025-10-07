/**
 * Map AI season response to valid Prisma enum values
 */
export function mapSeason(
  aiSeason: string
): 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' {
  const season = aiSeason.toUpperCase();

  // Handle common variations
  if (
    season.includes('DEMISAISON') ||
    season.includes('DEMI_SEASON') ||
    season.includes('DEMI-SEASON')
  ) {
    return 'AUTUMN'; // Demi-season is typically autumn/fall
  }
  if (season.includes('SPRING') || season.includes('ВЕСНА')) {
    return 'SPRING';
  }
  if (season.includes('SUMMER') || season.includes('ЛЕТО')) {
    return 'SUMMER';
  }
  if (
    season.includes('AUTUMN') ||
    season.includes('FALL') ||
    season.includes('ОСЕНЬ')
  ) {
    return 'AUTUMN';
  }
  if (season.includes('WINTER') || season.includes('ЗИМА')) {
    return 'WINTER';
  }

  // Default fallback
  return 'AUTUMN';
}

/**
 * Map AI gender response to valid Prisma enum values
 */
export function mapGender(aiGender: string): 'MALE' | 'FEMALE' {
  const gender = aiGender.toUpperCase();

  if (gender.includes('MALE') || gender.includes('МУЖСКОЙ')) {
    return 'MALE';
  }
  if (gender.includes('FEMALE') || gender.includes('ЖЕНСКИЙ')) {
    return 'FEMALE';
  }
  // Default to MALE if gender is unclear
  return 'MALE';
}

/**
 * Generate a unique article number for a product
 */
export function generateArticleNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ART-${timestamp}-${random}`.toUpperCase();
}

/**
 * Create a unique slug from a product name
 */
export function createSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}

/**
 * Map AI season response to valid Prisma enum values
 */
export function mapSeason(
  aiSeason: string
): 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' {
  if (!aiSeason || typeof aiSeason !== 'string') {
    return 'AUTUMN'; // Default fallback
  }

  const season = aiSeason.toUpperCase().trim();

  // Handle exact matches first (most specific)
  if (season === 'SPRING' || season === 'SUMMER' || season === 'AUTUMN' || season === 'WINTER') {
    return season as 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
  }

  // Handle common variations
  if (
    season.includes('DEMISAISON') ||
    season.includes('DEMI_SEASON') ||
    season.includes('DEMI-SEASON')
  ) {
    return 'AUTUMN'; // Demi-season is typically autumn/fall
  }

  // Handle combined seasons like "SPRING/SUMMER" - pick the first one found
  // Check in order: SPRING, SUMMER, AUTUMN, WINTER
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
  const gender = aiGender.toUpperCase().trim();

  // Check for exact matches first (most specific)
  if (gender === 'FEMALE' || gender === 'MALE') {
    return gender as 'MALE' | 'FEMALE';
  }

  // Check for FEMALE first (more specific, contains "MALE" as substring)
  if (gender.includes('FEMALE') || gender.includes('ЖЕНСКИЙ')) {
    return 'FEMALE';
  }
  // Then check for MALE (less specific)
  if (gender.includes('MALE') || gender.includes('МУЖСКОЙ')) {
    return 'MALE';
  }
  // Unknown string: default to FEMALE (as per original logic)
  return 'FEMALE';
}

/**
 * Infer gender from sizes when AI gender is missing
 */
export function inferGenderFromSizes(
  sizes: Array<{ size: string; count: number }> | undefined | null
): 'MALE' | 'FEMALE' | null {
  if (!sizes || sizes.length === 0) return null;
  const numericSizes: number[] = sizes
    .map(s => parseInt(String(s.size), 10))
    .filter(n => !Number.isNaN(n));
  if (numericSizes.length === 0) return null;
  const min = Math.min(...numericSizes);
  const max = Math.max(...numericSizes);
  if (max <= 40) return 'FEMALE';
  if (min >= 41) return 'MALE';
  // Mixed range: decide by majority around threshold
  const femaleCount = numericSizes.filter(n => n <= 40).length;
  const maleCount = numericSizes.filter(n => n >= 41).length;
  if (femaleCount > maleCount) return 'FEMALE';
  if (maleCount > femaleCount) return 'MALE';
  return null;
}

/**
 * Generate a unique article number for a product
 */
export function generateArticleNumber(): string {
  // Generate a 6-digit random number
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return randomNumber.toString();
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

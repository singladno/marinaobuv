/**
 * System prompt for YandexGPT product extraction
 */
export function getSystemPrompt(categoryTreeJson?: string): string {
  return `You are a product data extraction assistant for a shoe store.
 Extract product information from the given text and return STRICT JSON matching this schema:
 {
   "season": "spring"|"summer"|"autumn"|"winter" (optional),
   "typeSlug": string (optional),
   "pricePair": number (in rubles, optional),
   "packPairs": number (optional),
   "priceBox": number (optional),
   "material": string (optional),
   "gender": "female"|"male"|"unisex" (optional),
   "sizes": Array<{size: string, count: number}> (optional),
   "notes": string (optional),
   "providerDiscount": number (in rubles, optional)
 }
 
 Rules:
 - The text may contain multiple messages from the same user about the same product
 - Combine all information from all messages to create a complete product description
 - Extract only information explicitly mentioned in the text
 - Store prices in rubles (no conversion needed)
 - NEVER skip any data - every image and text message must be accounted for in the final product entries
 
 Size Extraction Rules (CRITICAL):
 - ONLY extract sizes that are clearly shoe sizes (typically 35-45 for adults, 20-35 for children)
 - DO NOT interpret provider place/address as sizes (e.g., "3/4/17" is a market place, NOT sizes)
 - DO NOT interpret phone numbers, addresses, or coordinates as sizes
 - Look for explicit size mentions like "размеры 36/37/38" or "36,37,38" or "36-38"
 - Size patterns: "36/37/38/39/40/41" means 1 pair of each size (36:1, 37:1, 38:1, etc.)
 - Size patterns: "36:2/37:1/38:3" means 2 pairs of 36, 1 pair of 37, 3 pairs of 38
 - If no quantity is specified for a size, assume 1 pair
 - Always include count field, never use 0
 - If no clear size information is provided, omit the sizes field entirely
 - Be very conservative - only extract if you're 100% sure they are shoe sizes

Special Case (compact range with total pairs):
- If text contains lines like "Пара 6" and "Размер 35/40", interpret this as a continuous range from 35 through 40 inclusive, one pair for each size.
- In that case, sizes should be 35,36,37,38,39,40 each with count:1, and packPairs should be 6.
 
 Pack Pairs Calculation (ALWAYS REQUIRED):
 - ALWAYS calculate packPairs from sizes if not explicitly mentioned by provider
 - Count total pairs: sum up all count values from sizes array
 - Examples: "36/37/38/39/40/41" → 6 pairs, "36/37/38/38/39/39/40/41" → 8 pairs
 - If packPairs is explicitly mentioned in text, use that value instead
 - If no sizes are available, packPairs should be null
 
 General Rules:
 - Return only valid JSON, no additional text
 - If information is not clear, omit the field entirely (do not include null values)
 - Be conservative with assumptions
 - Combine all price information from different messages
 
 Size Examples (what to extract vs what NOT to extract):
 ✅ CORRECT: "размеры 36/37/38" → sizes: [{"size": "36", "count": 1}, {"size": "37", "count": 1}, {"size": "38", "count": 1}], packPairs: 3
 ✅ CORRECT: "36,37,38,39" → sizes: [{"size": "36", "count": 1}, {"size": "37", "count": 1}, {"size": "38", "count": 1}, {"size": "39", "count": 1}], packPairs: 4
 ✅ CORRECT: "36:2/37:1/38:3" → sizes: [{"size": "36", "count": 2}, {"size": "37", "count": 1}, {"size": "38", "count": 3}], packPairs: 6
 ✅ CORRECT: "36/37/38/38/39/39/40/41" → sizes: [{"size": "36", "count": 1}, {"size": "37", "count": 1}, {"size": "38", "count": 2}, {"size": "39", "count": 2}, {"size": "40", "count": 1}, {"size": "41", "count": 1}], packPairs: 8
 ❌ WRONG: "3/4/17" (provider place) → omit sizes field entirely, packPairs: null
 ❌ WRONG: "8-800-555-35-35" (phone) → omit sizes field entirely, packPairs: null
 ❌ WRONG: "ул. Ленина 15/7" (address) → omit sizes field entirely, packPairs: null
 
 Discount Extraction:
 - Look for discount patterns like "С КОРОБКИ 500Р СКИДКА", "скидка 500", "скидка 400"
 - Also look for simple negative numbers like "-500", "-400" (these are discount amounts)
 - Store discount amounts in rubles (no conversion needed)
 - Only extract if discount is explicitly mentioned
 - Examples: "500Р СКИДКА" = 500 rubles, "-500" = 500 rubles`;
}

export function getValidationPrompt(): string {
  return `Second pass disabled.`;
}

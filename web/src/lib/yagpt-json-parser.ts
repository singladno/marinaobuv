/**
 * Clean JSON string for parsing
 */
export function cleanJsonString(jsonStr: string): string {
  return jsonStr
    .replace(/,\s*}/g, '}') // Remove trailing commas before }
    .replace(/,\s*]/g, ']') // Remove trailing commas before ]
    .replace(/(\w+):/g, '"$1":') // Add quotes around keys if missing
    .replace(/:(\w+)/g, ':"$1"') // Add quotes around string values if missing
    .replace(/:(\d+)/g, ':$1') // Keep numbers as numbers
    .replace(/:true/g, ':true') // Keep booleans
    .replace(/:false/g, ':false')
    .replace(/:null/g, ':null')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract JSON from cleaned string
 */
export function extractJsonFromString(cleanedJson: string): unknown {
  // Find the first complete JSON object by counting braces
  const firstBrace = cleanedJson.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('No JSON object found');
  }

  let braceCount = 0;
  let endPos = firstBrace;

  for (let i = firstBrace; i < cleanedJson.length; i++) {
    if (cleanedJson[i] === '{') {
      braceCount++;
    } else if (cleanedJson[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endPos = i;
        break;
      }
    }
  }

  if (braceCount !== 0) {
    throw new Error('Incomplete JSON object');
  }

  const extracted = cleanedJson.substring(firstBrace, endPos + 1);
  return JSON.parse(extracted);
}

/**
 * Parse JSON content from YandexGPT response
 */
export function parseJsonContent(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.log('Initial JSON parse failed, trying extraction methods...');

    // Try to extract JSON from the response if it's wrapped in markdown or other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        console.log('Direct JSON match failed, trying cleaned extraction...');
        // If still fails, try to clean up the JSON more aggressively
        const cleanedJson = cleanJsonString(jsonMatch[0]);
        try {
          return JSON.parse(cleanedJson);
        } catch {
          console.log('Cleaned JSON parse failed, trying brace counting...');
          return extractJsonFromString(cleanedJson);
        }
      }
    }

    // If no JSON object found with regex, try to find it manually
    const firstBrace = content.indexOf('{');
    if (firstBrace !== -1) {
      try {
        return extractJsonFromString(content.substring(firstBrace));
      } catch (error4) {
        console.log('Manual extraction failed:', error4);
      }
    }

    throw new Error(
      `Could not parse JSON from YandexGPT response. Original error: ${error}`
    );
  }
}

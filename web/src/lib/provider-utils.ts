import { prisma } from './db';

/**
 * Extract provider name from WhatsApp sender name
 * This function tries to identify the provider from the sender's name
 */
export function extractProviderFromSenderName(pushName: string | null): string | null {
  if (!pushName) return null;

  // Clean the name - remove common prefixes/suffixes
  let cleanName = pushName.trim();

  // Remove common WhatsApp prefixes
  cleanName = cleanName.replace(/^\+?\d+\s*/, ''); // Remove phone numbers
  cleanName = cleanName.replace(/^@/, ''); // Remove @ symbols

  // If the name is too short or contains only numbers, skip
  if (cleanName.length < 2 || /^\d+$/.test(cleanName)) {
    return null;
  }

  return cleanName;
}

/**
 * Get or create provider by name
 * Since Provider table was removed, we'll just return the name as a string
 */
export async function getOrCreateProvider(name: string): Promise<string> {
  // Since the Provider table was removed, we'll just return the name
  // This maintains compatibility with the existing code
  return name;
}

/**
 * Process provider from WhatsApp message data
 */
export async function processProviderFromMessage(data: Record<string, unknown>): Promise<string | null> {
  const pushName = data.pushName as string | null;
  const providerName = extractProviderFromSenderName(pushName);

  if (!providerName) {
    return null;
  }

  return await getOrCreateProvider(providerName);
}

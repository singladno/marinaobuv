import { prisma } from './db-node';
import { extractNormalizedPhone } from './utils/whatsapp-phone-extractor';

/**
 * Extract provider name and place from WhatsApp sender name
 * This function tries to identify the provider from the sender's name
 */
export function extractProviderFromSenderName(pushName: string | null): {
  name: string | null;
  place: string | null;
} {
  if (!pushName) return { name: null, place: null };

  // Clean the name - remove common prefixes/suffixes
  let cleanName = pushName.trim();

  // Remove common WhatsApp prefixes
  cleanName = cleanName.replace(/^\+?\d+\s*/, ''); // Remove phone numbers
  cleanName = cleanName.replace(/^@/, ''); // Remove @ symbols

  // If the name is too short or contains only numbers, skip
  if (cleanName.length < 2 || /^\d+$/.test(cleanName)) {
    return { name: null, place: null };
  }

  // Look for market address pattern like "3/4/17" near the name
  const placeMatch = cleanName.match(/(\d+\/\d+\/\d+)/);
  let place: string | null = null;
  let name = cleanName;

  if (placeMatch) {
    place = placeMatch[1];
    // Remove the place from the name
    name = cleanName.replace(placeMatch[0], '').trim();
    // Clean up any extra spaces or punctuation
    name = name.replace(/[,\s]+$/, '').replace(/^[,\s]+/, '');
  }

  // If name becomes empty after removing place, use original
  if (!name || name.length < 2) {
    name = cleanName;
  }

  return { name, place };
}

/**
 * Get or create Provider entity by phone/name and return providerId
 */
export async function getOrCreateProvider(
  phone: string | null,
  name: string | null,
  place: string | null = null
): Promise<string | null> {
  if (!phone && !name) return null;

  // Extract normalized phone from WhatsApp ID or regular phone
  const normalizedPhone = extractNormalizedPhone(phone);

  // Try by normalized phone first if available
  if (normalizedPhone) {
    const byPhone = await prisma.provider.findFirst({
      where: { phone: normalizedPhone },
    });
    if (byPhone) {
      // Update place if provided and not already set
      if (place && !byPhone.place) {
        await prisma.provider.update({
          where: { id: byPhone.id },
          data: { place },
        });
      }
      return byPhone.id;
    }
  }

  // Try by name
  if (name) {
    const byName = await prisma.provider.findFirst({ where: { name } });
    if (byName) {
      // Backfill phone if missing
      if (normalizedPhone && !byName.phone) {
        await prisma.provider.update({
          where: { id: byName.id },
          data: { phone: normalizedPhone },
        });
      }
      // Update place if provided and not already set
      if (place && !byName.place) {
        await prisma.provider.update({
          where: { id: byName.id },
          data: { place },
        });
      }
      return byName.id;
    }
  }

  // Create new provider
  const created = await prisma.provider.create({
    data: {
      name: name ?? (normalizedPhone as string),
      phone: normalizedPhone ?? null,
      place: place,
    },
  });
  return created.id;
}

/**
 * Process provider from WhatsApp message data
 */
export async function processProviderFromMessage(
  data: Record<string, unknown>
): Promise<string | null> {
  const from =
    (data.from as string | null) ?? (data.phone as string | null) ?? null;
  const pushName =
    (data.fromName as string | null) ??
    (data.pushName as string | null) ??
    null;
  const { name, place } = extractProviderFromSenderName(pushName);
  return await getOrCreateProvider(from, name, place);
}

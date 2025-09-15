import { prisma } from './db-node';

/**
 * Extract provider name from WhatsApp sender name
 * This function tries to identify the provider from the sender's name
 */
export function extractProviderFromSenderName(
  pushName: string | null
): string | null {
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
 * Get or create Provider entity by phone/name and return providerId
 */
export async function getOrCreateProvider(
  phone: string | null,
  name: string | null
): Promise<string | null> {
  if (!phone && !name) return null;

  // Try by phone first if available
  if (phone) {
    const byPhone = await prisma.provider.findFirst({ where: { phone } });
    if (byPhone) return byPhone.id;
  }

  // Try by name
  if (name) {
    const byName = await prisma.provider.findFirst({ where: { name } });
    if (byName) {
      // Backfill phone if missing
      if (phone && !byName.phone) {
        await prisma.provider.update({
          where: { id: byName.id },
          data: { phone },
        });
      }
      return byName.id;
    }
  }

  // Create new provider
  const created = await prisma.provider.create({
    data: { name: name ?? (phone as string), phone: phone ?? null },
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
  const name = extractProviderFromSenderName(pushName);
  return await getOrCreateProvider(from, name);
}

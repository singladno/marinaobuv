/**
 * Utility to extract clean phone numbers from WhatsApp identifiers
 * WhatsApp phone numbers come in format: 79776254303@c.us
 * We need to extract: 79776254303 and normalize it
 */

import { normalizePhoneToE164 } from '../server/sms';

/**
 * Extract clean phone number from WhatsApp identifier
 * @param whatsappId - WhatsApp identifier like "79776254303@c.us"
 * @returns Normalized phone number like "+79776254303" or null if invalid
 */
export function extractPhoneFromWhatsAppId(
  whatsappId: string | null
): string | null {
  if (!whatsappId) return null;

  // Remove @c.us suffix and any other WhatsApp-specific suffixes
  const cleanId = whatsappId.replace(/@c\.us$/, '').replace(/@g\.us$/, '');

  // If it's already a clean phone number, normalize it
  if (/^\d+$/.test(cleanId)) {
    return normalizePhoneToE164(cleanId);
  }

  return null;
}

/**
 * Check if a string is a WhatsApp identifier
 * @param value - String to check
 * @returns true if it looks like a WhatsApp ID
 */
export function isWhatsAppId(value: string): boolean {
  return /^\d+@[cg]\.us$/.test(value);
}

/**
 * Extract phone from either WhatsApp ID or regular phone number
 * @param phoneOrId - Either a WhatsApp ID or regular phone number
 * @returns Normalized phone number
 */
export function extractNormalizedPhone(
  phoneOrId: string | null
): string | null {
  if (!phoneOrId) return null;

  if (isWhatsAppId(phoneOrId)) {
    return extractPhoneFromWhatsAppId(phoneOrId);
  }

  // Only normalize if it looks like a valid phone number
  if (/^\d+$/.test(phoneOrId) || phoneOrId.startsWith('+')) {
    return normalizePhoneToE164(phoneOrId);
  }

  return null;
}

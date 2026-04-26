/**
 * Normalize provider phone to Green API WhatsApp chat id `{digits}@c.us`.
 */
export function phoneToWaChatId(
  phone: string | null | undefined
): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `${digits}@c.us`;
}

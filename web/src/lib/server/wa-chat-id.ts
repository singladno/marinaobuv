/**
 * Validates WhatsApp chat ids used by admin inbox / Green API routes.
 */
export function isValidAdminWaChatId(id: string): boolean {
  if (!id || id.length > 200) return false;
  if (!/^[0-9+\-@.a-zA-Z_]+$/.test(id)) return false;
  return (
    id.endsWith('@c.us') ||
    id.endsWith('@g.us') ||
    id.endsWith('@s.whatsapp.net') ||
    id.endsWith('@lid')
  );
}

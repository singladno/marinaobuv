/**
 * Chat list search: matches names and phone/chat ids whether the user types +7… or 7…
 */

export type WaInboxChatSearchable = {
  id: string;
  name: string;
  contactName?: string;
};

function waChatListLabel(chat: WaInboxChatSearchable): string {
  const n = (chat.name || '').trim();
  const c = (chat.contactName || '').trim();
  if (n) return n;
  if (c) return c;
  return chat.id;
}

/** Digits only, for comparing international numbers regardless of + or spaces. */
function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/**
 * Returns true if the chat should appear for the current search box value.
 */
export function waInboxChatMatchesFilter(
  chat: WaInboxChatSearchable,
  rawQuery: string
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const qNoLeadingPlus = q.replace(/^\++/, '');
  const label = waChatListLabel(chat).toLowerCase();
  const idLower = chat.id.toLowerCase();

  if (
    label.includes(q) ||
    idLower.includes(q) ||
    label.includes(qNoLeadingPlus) ||
    idLower.includes(qNoLeadingPlus)
  ) {
    return true;
  }

  const qDigits = digitsOnly(q);
  if (qDigits.length >= 5) {
    const idDigits = digitsOnly(chat.id);
    const labelDigits = digitsOnly(label);
    if (idDigits.includes(qDigits) || labelDigits.includes(qDigits)) {
      return true;
    }
  }

  return false;
}

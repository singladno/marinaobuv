export const MULTICOLOR_PACK_DESCRIPTION_PHRASE = 'В упаковке разные цвета';

function mentionsMixedColors(text: string): boolean {
  return /разн(ые|ых)\s+цвет/i.test(text) || /цвета\s+разные/i.test(text);
}

/**
 * When the WhatsApp text says the box is a color mix, the card copy must say so.
 * Vision often omits this; append a fixed phrase instead of hoping the LLM will.
 */
export function ensureMulticolorPackDescription(
  description: string | null | undefined,
  multicolorPack: boolean
): string {
  const text = (description ?? '').trim();
  if (!multicolorPack) return text;
  if (mentionsMixedColors(text)) return text;
  if (!text) return `${MULTICOLOR_PACK_DESCRIPTION_PHRASE}.`;
  const ended = /[.!?…]$/.test(text) ? text : `${text}.`;
  return `${ended} ${MULTICOLOR_PACK_DESCRIPTION_PHRASE}.`;
}

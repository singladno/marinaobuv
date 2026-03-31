import Groq from 'groq-sdk';
import { groqChatCompletion } from './groq-api-wrapper';
import { getTokenLogger } from '../utils/groq-token-logger';

/** WhatsApp pipeline: set in updateProductWithAnalysis from text-analysis JSON → Product.agLabels.waMulticolorPack */
export function readWaMulticolorPackFromAgLabels(agLabels: unknown): boolean {
  if (!agLabels || typeof agLabels !== 'object' || Array.isArray(agLabels)) {
    return false;
  }
  return (agLabels as Record<string, unknown>).waMulticolorPack === true;
}

const MULTICOLOR_PACK_SYSTEM_PROMPT = `Вы классификатор объявлений оптом об обуви. По тексту определите: продаётся ли ОДНА упаковка/коробка, в которой намеренно смешаны РАЗНЫЕ цвета пары (поставщик отгружает микс цветов в одной коробке).

Верните ТОЛЬКО JSON вида:
{"multicolorPack": true}
или
{"multicolorPack": false}

true — если из текста следует, что в упаковке намеренно разные цвета (например: «разные цвета в упаковке», «цвета разные», «в упаковке разные цвета», «микс цветов», «разноцветный набор», «12 пар (цвета разные)»).

false — если указан один цвет, или цвета перечислены как отдельные позиции («чёрный / белый» по отдельности), или текст не говорит о смешанной расцветке в одной коробке, или текста нет/неясно.

Не угадывайте по одному слову без контекста упаковки — при сомнении верните false.`;

/**
 * Small LLM call for flows without WhatsApp text-analysis (e.g. aggregator).
 * On failure returns false (usual per-image color flow).
 */
export async function detectMulticolorPackWithGroq(
  groq: Groq,
  text: string | null | undefined,
  operationId: string
): Promise<boolean> {
  if (!text?.trim()) {
    return false;
  }

  const trimmed = text.length > 12000 ? text.slice(0, 12000) : text;

  try {
    const model = process.env.GROQ_TEXT_MODEL || 'llama-3.1-8b-instant';
    const response = await groqChatCompletion(
      groq,
      {
        model,
        messages: [
          { role: 'system', content: MULTICOLOR_PACK_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Текст объявления:\n\n${trimmed}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 60,
      },
      operationId,
      {
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        timeoutMs: 60000,
      }
    );

    if ('usage' in response && response.usage) {
      getTokenLogger().log('multicolor-pack-detection', model, response.usage, {
        operationId,
        textLength: trimmed.length,
      });
    }

    if (!('choices' in response)) {
      return false;
    }

    const raw = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(raw) as { multicolorPack?: unknown };
    return parsed.multicolorPack === true;
  } catch (e) {
    console.warn(
      `[multicolor-pack-detection] failed for ${operationId}, defaulting to false:`,
      e
    );
    return false;
  }
}

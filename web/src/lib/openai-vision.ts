import OpenAI from 'openai';

import { env } from './env';

type ProductDraft = {
  name?: string | null;
  article?: string | null;
  season?: string | null;
  typeSlug?: string | null;
  pricePair?: number | null;
  packPairs?: number | null;
  priceBox?: number | null;
  material?: string | null;
  gender?: string | null;
  sizes?: Array<{ size: string; count?: number; stock?: number }> | null;
  notes?: string | null;
  providerDiscount?: number | null;
};

export async function validateDraftWithImagesOpenAI(
  draft: ProductDraft,
  imageUrls: string[]
): Promise<{
  normalizedName: string;
  productColor: string | null;
  images: Array<{ url: string; isFalseImage: boolean; color?: string | null }>;
  requestPayload: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
  rawResponse: unknown;
} | null> {
  if (!env.OPENAI_API_KEY) {
    console.warn(
      'OPENAI_API_KEY is not set; skipping OpenAI vision validation'
    );
    return null;
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const system = `You are an image color detection assistant for a shoe catalog.
Given a short draft JSON and a list of image URLs, your ONLY task is: for EACH image URL, return the color of the shoe shown in that image.

Rules:
- Use short Russian color names: "черный", "белый", "бежевый", "синий", "красный", "коричневый", "серый", "зелёный", "розовый", "фиолетовый", "бордовый".
- If the color is unclear, return null for that image's color.
- Maintain the exact input order of image URLs.
- Return STRICT JSON with this shape:
  { "images": [ { "url": "...", "color": "черный" | null }, ... ] }
- Do NOT include explanations or any extra fields.`;

  const userParts: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  > = [{ type: 'text', text: `Draft: ${JSON.stringify(draft)}` }];

  for (const url of imageUrls) {
    userParts.push({ type: 'image_url', image_url: { url } });
  }

  const requestPayload: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
    {
      model: (env.OPENAI_VISION_MODEL || 'gpt-4o-mini') as string,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: userParts as unknown as
            | string
            | OpenAI.Chat.Completions.ChatCompletionContentPart[],
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    };

  try {
    // Retry with backoff on 429
    const maxRetries = 3;
    let attempt = 0;
    while (true) {
      try {
        const resp = await openai.chat.completions.create(requestPayload);
        const content =
          (resp as OpenAI.Chat.Completions.ChatCompletion).choices[0]?.message
            ?.content ?? '';
        if (!content) return null;

        const json = JSON.parse(content as string) as {
          images?: Array<{ url?: string; color?: string | null }>;
        };

        const images: Array<{
          url: string;
          isFalseImage: boolean;
          color?: string | null;
        }> = Array.isArray(json?.images)
          ? json.images.map((img, idx) => ({
              url:
                typeof img?.url === 'string' ? img.url : imageUrls[idx] || '',
              isFalseImage: false,
              color:
                typeof img?.color === 'string' && img.color.trim()
                  ? img.color.trim()
                  : null,
            }))
          : imageUrls.map(u => ({ url: u, isFalseImage: false, color: null }));

        // Determine dominant product color, if any
        const colorCounts = images.reduce<Record<string, number>>((acc, im) => {
          if (im.color) acc[im.color] = (acc[im.color] || 0) + 1;
          return acc;
        }, {});
        const productColor =
          Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          null;
        const normalizedName = draft.name || 'Не указано';

        // Optional inter-request delay to respect org limits
        const delayMs = env.OPENAI_REQUEST_DELAY_MS || 0;
        if (delayMs > 0) {
          await new Promise(r => setTimeout(r, delayMs));
        }

        return {
          normalizedName,
          productColor,
          images,
          requestPayload,
          rawResponse: resp,
        };
      } catch (err: any) {
        if (err?.status === 429 && attempt < maxRetries) {
          const headerMs = err?.headers?.get?.('retry-after-ms');
          const headerSec = err?.headers?.get?.('retry-after');
          const retryMs = headerMs
            ? parseInt(headerMs, 10)
            : headerSec
              ? parseFloat(headerSec) * 1000
              : 1500;
          const backoff = 500 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, Math.max(retryMs, backoff)));
          attempt++;
          continue;
        }
        throw err;
      }
    }
  } catch (e) {
    console.error('OpenAI vision validation failed:', e);
    return null;
  }
}

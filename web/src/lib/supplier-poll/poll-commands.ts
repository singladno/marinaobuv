import { z } from 'zod';

const pollCommandSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SET_ITEM_STOCK'),
    order_item_id: z.string().min(1),
    stock: z.enum(['available', 'unavailable', 'unclear']),
    confidence: z.number().min(0).max(1),
    notes: z.string().max(2000).optional(),
  }),
  z.object({
    type: z.literal('SEND_SUPPLIER_MESSAGE'),
    text: z.string().min(1).max(20_000),
    confidence: z.number().min(0).max(1).optional(),
  }),
  z.object({
    type: z.literal('RESEND_PRODUCT_IMAGES'),
    confidence: z.number().min(0).max(1).optional(),
  }),
  z.object({
    type: z.literal('ASK_REPLACEMENT_FOR_ITEM'),
    order_item_id: z.string().min(1),
    confidence: z.number().min(0).max(1).optional(),
  }),
  z.object({
    type: z.literal('ASK_STOCK_CHECK_FOR_ITEM'),
    order_item_id: z.string().min(1),
    confidence: z.number().min(0).max(1).optional(),
  }),
  z.object({
    type: z.literal('PROPOSE_REPLACEMENT_FROM_WA'),
    order_item_id: z.string().min(1),
    replacement: z.enum([
      'none',
      'offered_with_image',
      'offered_text_only',
      'unclear',
    ]),
    confidence: z.number().min(0).max(1),
    notes: z.string().max(2000).optional(),
    replacement_image_wa_message_id: z.string().min(1).nullable().optional(),
  }),
]);

export type PollCommand = z.infer<typeof pollCommandSchema>;

const noOpResultSchema = z.object({
  outcome: z.literal('NO_OP'),
  reason: z.string().max(2000),
  confidence: z.number().min(0).max(1).optional(),
});

const applyResultSchema = z.object({
  outcome: z.literal('APPLY'),
  commands: z.array(pollCommandSchema).min(1).max(32),
  overall_notes: z.string().max(2000).optional(),
  overall_unclear: z.boolean().optional(),
});

const gptResultSchema = z.discriminatedUnion('outcome', [
  noOpResultSchema,
  applyResultSchema,
]);

export type SupplierPollGptResult =
  | {
      outcome: 'NO_OP';
      reason: string;
      confidence?: number;
    }
  | {
      outcome: 'APPLY';
      commands: PollCommand[];
      overall_notes?: string;
      overall_unclear?: boolean;
    };

/**
 * Parse and validate LLM JSON. Returns null on invalid shape; logs are left to the caller.
 */
export function parseSupplierPollGptResult(
  data: unknown
): SupplierPollGptResult | null {
  const r = gptResultSchema.safeParse(data);
  if (!r.success) return null;
  const v = r.data;
  if (v.outcome === 'NO_OP') {
    return {
      outcome: 'NO_OP',
      reason: v.reason,
      ...(v.confidence !== undefined ? { confidence: v.confidence } : {}),
    };
  }
  return {
    outcome: 'APPLY',
    commands: v.commands,
    ...(v.overall_notes !== undefined
      ? { overall_notes: v.overall_notes }
      : {}),
    ...(v.overall_unclear !== undefined
      ? { overall_unclear: v.overall_unclear }
      : {}),
  };
}

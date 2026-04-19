import { env } from '@/lib/env';

/** Green API sends `instanceData.idInstance` on webhooks (number or string). */
export function normalizeGreenInstanceId(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

export type GreenWebhookInstanceMatch = {
  /** Raw id from payload, if present */
  idInstance: string | null;
  /** Product catalog pipeline (`WhatsAppMessage`) */
  isProductParser: boolean;
  /** Admin inbox (`WaAdmin*`) */
  isAdminChat: boolean;
};

/**
 * Route webhook handling by instance. If `instanceData` is missing (legacy), only the
 * product parser path runs — admin inbox is skipped.
 */
export function matchGreenWebhookInstance(payload: {
  instanceData?: { idInstance?: unknown };
}): GreenWebhookInstanceMatch {
  const id = normalizeGreenInstanceId(payload?.instanceData?.idInstance);
  const parserId = normalizeGreenInstanceId(env.GREEN_API_INSTANCE_ID);
  const adminId = normalizeGreenInstanceId(env.GREEN_API_ADMIN_INSTANCE_ID);

  if (!id) {
    return {
      idInstance: null,
      isProductParser: true,
      isAdminChat: false,
    };
  }

  return {
    idInstance: id,
    isProductParser: parserId !== null && id === parserId,
    isAdminChat: adminId !== null && id === adminId,
  };
}

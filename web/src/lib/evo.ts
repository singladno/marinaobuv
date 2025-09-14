import { env } from './env';

export interface WebhookConfig {
  url: string;
  webhook_by_events: boolean;
  webhook_base64: boolean;
  events: string[];
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

/**
 * Set webhook configuration for Evolution API instance
 */
export async function setInstanceWebhook(
  url: string,
  events: string[]
): Promise<WebhookResponse> {
  const config: WebhookConfig = {
    url,
    webhook_by_events: true,
    webhook_base64: true,
    events,
  };

  try {
    const response = await fetch(
      `${env.EVOLUTION_BASE_URL}/webhook/set/${env.EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.EVOLUTION_API_KEY,
        },
        body: JSON.stringify(config),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Evolution API error: ${data.message || response.statusText}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Failed to set Evolution webhook:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a JID (Jabber ID) represents a WhatsApp group
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us');
}

/**
 * Get media URL from Evolution API
 */
export async function getMediaUrl(_mediaId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${env.EVOLUTION_BASE_URL}/s3/getMediaUrl/${env.EVOLUTION_INSTANCE}`,
      {
        method: 'GET',
        headers: {
          apikey: env.EVOLUTION_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get media URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url || null;
  } catch (error) {
    console.error('Failed to get media URL:', error);
    return null;
  }
}

/**
 * Extract text content from WhatsApp message
 */
export function extractMessageText(message: Record<string, unknown>): string | null {
  // Try different message types in order of preference
  if (typeof message.conversation === 'string') {
    return message.conversation;
  }

  const extendedText = message.extendedTextMessage as Record<string, unknown> | undefined;
  if (extendedText && typeof extendedText.text === 'string') {
    return extendedText.text;
  }

  const imageMessage = message.imageMessage as Record<string, unknown> | undefined;
  if (imageMessage && typeof imageMessage.caption === 'string') {
    return imageMessage.caption;
  }

  const videoMessage = message.videoMessage as Record<string, unknown> | undefined;
  if (videoMessage && typeof videoMessage.caption === 'string') {
    return videoMessage.caption;
  }

  const documentMessage = message.documentMessage as Record<string, unknown> | undefined;
  if (documentMessage && typeof documentMessage.caption === 'string') {
    return documentMessage.caption;
  }

  return null;
}

/**
 * Get media information from WhatsApp message
 */
export function extractMediaInfo(message: Record<string, unknown>): { type: string; data?: string; mimeType?: string } | null {
  const imageMessage = message.imageMessage as Record<string, unknown> | undefined;
  if (imageMessage) {
    return {
      type: 'image',
      data: (imageMessage.base64 as string) || (imageMessage.url as string),
      mimeType: imageMessage.mimetype as string,
    };
  }

  const videoMessage = message.videoMessage as Record<string, unknown> | undefined;
  if (videoMessage) {
    return {
      type: 'video',
      data: (videoMessage.base64 as string) || (videoMessage.url as string),
      mimeType: videoMessage.mimetype as string,
    };
  }

  const documentMessage = message.documentMessage as Record<string, unknown> | undefined;
  if (documentMessage) {
    return {
      type: 'document',
      data: (documentMessage.base64 as string) || (documentMessage.url as string),
      mimeType: documentMessage.mimetype as string,
    };
  }

  return null;
}

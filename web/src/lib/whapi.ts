import { env } from './env';

/**
 * Check if a JID (Jabber ID) represents a WhatsApp group
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us');
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
export function mediaInfo(message: Record<string, unknown>): { mime?: string; id?: string; url?: string } | null {
  // Check for media in the message object
  const imageMessage = message.imageMessage as Record<string, unknown> | undefined;
  if (imageMessage) {
    return {
      mime: imageMessage.mimetype as string,
      id: imageMessage.id as string,
      url: imageMessage.url as string,
    };
  }

  const videoMessage = message.videoMessage as Record<string, unknown> | undefined;
  if (videoMessage) {
    return {
      mime: videoMessage.mimetype as string,
      id: videoMessage.id as string,
      url: videoMessage.url as string,
    };
  }

  const documentMessage = message.documentMessage as Record<string, unknown> | undefined;
  if (documentMessage) {
    return {
      mime: documentMessage.mimetype as string,
      id: documentMessage.id as string,
      url: documentMessage.url as string,
    };
  }

  // Check for media in the top-level media object
  const media = message.media as Record<string, unknown> | undefined;
  if (media) {
    return {
      mime: media.mimeType as string,
      id: media.id as string,
      url: media.url as string,
    };
  }

  return null;
}

/**
 * Fetch media buffer from Whapi.cloud
 */
export async function fetchMediaBuffer(input: {
  url?: string;
  id?: string;
  token: string;
}): Promise<{ buf: Buffer; mime: string; ext: string }> {
  const { url, id, token } = input;

  let mediaUrl: string;
  let mimeType: string;

  if (url) {
    // Direct URL provided
    mediaUrl = url;
    // We'll need to fetch the content to determine MIME type
    const headResponse = await fetch(mediaUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    mimeType = headResponse.headers.get('content-type') || 'application/octet-stream';
  } else if (id) {
    // Media ID provided, need to get URL from Whapi
    const mediaResponse = await fetch(`${env.WHAPI_BASE_URL}/media/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!mediaResponse.ok) {
      throw new Error(`Failed to get media info: ${mediaResponse.statusText}`);
    }

    const mediaData = await mediaResponse.json();
    mediaUrl = mediaData.url || mediaData.download_url;
    mimeType = mediaData.mime_type || mediaData.mimetype || 'application/octet-stream';
  } else {
    throw new Error('Either url or id must be provided');
  }

  // Fetch the actual media content
  const response = await fetch(mediaUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch media: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = getExtensionFromMime(mimeType);

  return { buf: buffer, mime: mimeType, ext };
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  };

  return mimeMap[mimeType] || 'bin';
}

/**
 * Set webhook configuration for Whapi.cloud
 * Note: Whapi.cloud may not support programmatic webhook configuration
 * You may need to set the webhook URL manually in the Whapi panel
 */
export async function setWebhook(
  webhookUrl: string,
  events: string[] = ['messages.upsert', 'messages.update', 'messages.delete']
): Promise<{ success: boolean; message?: string; data?: Record<string, unknown> }> {
  try {
    // Try different possible endpoints
    const endpoints = [
      `${env.WHAPI_BASE_URL}/webhook`,
      `${env.WHAPI_BASE_URL}/webhooks`,
      `${env.WHAPI_BASE_URL}/settings/webhook`,
      `${env.WHAPI_BASE_URL}/api/webhook`,
    ];

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.WHAPI_TOKEN}`,
          },
          body: JSON.stringify({
            url: webhookUrl,
            events,
            send_media: true,
            base64: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data,
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue;
      }
    }

    // If all endpoints fail, return a message about manual configuration
    return {
      success: false,
      message: `Webhook configuration via API not supported. Please set webhook URL manually in Whapi panel: ${webhookUrl}`,
    };
  } catch (error) {
    console.error('Failed to set Whapi webhook:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

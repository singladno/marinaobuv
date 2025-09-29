import { env } from './env';
import { getExtensionFromMime } from './whapi-utils';

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
        Authorization: `Bearer ${token}`,
      },
    });
    mimeType =
      headResponse.headers.get('content-type') || 'application/octet-stream';
  } else if (id) {
    // Media ID provided, need to get URL from Whapi
    const mediaResponse = await fetch(`${env.WHAPI_BASE_URL}/media/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!mediaResponse.ok) {
      throw new Error(`Failed to get media info: ${mediaResponse.statusText}`);
    }

    const mediaData = await mediaResponse.json();
    mediaUrl = mediaData.url || mediaData.download_url;
    mimeType =
      mediaData.mime_type || mediaData.mimetype || 'application/octet-stream';
  } else {
    throw new Error('Either url or id must be provided');
  }

  // Fetch the actual media content
  const response = await fetch(mediaUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
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
 * Set webhook configuration for Whapi.cloud
 * Note: Whapi.cloud may not support programmatic webhook configuration
 * You may need to set the webhook URL manually in the Whapi panel
 */
export async function setWebhook(
  webhookUrl: string,
  events: string[] = ['messages.upsert', 'messages.update', 'messages.delete']
): Promise<{
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}> {
  try {
    // Try different possible endpoints
    const endpoints = [
      `${env.WHAPI_BASE_URL}/webhook`,
      `${env.WHAPI_BASE_URL}/webhooks`,
      `${env.WHAPI_BASE_URL}/settings/webhook`,
      `${env.WHAPI_BASE_URL}/api/webhook`,
    ];

    // let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.WHAPI_TOKEN}`,
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
      } catch {
        // lastError = error instanceof Error ? error : new Error('Unknown error');
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

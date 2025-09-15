import { env } from './env';

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: number;
  pushName?: string;
  message?: Record<string, unknown>;
  media?: {
    id?: string;
    url?: string;
    mimeType?: string;
  };
}

interface MessagesResponse {
  success: boolean;
  data?: {
    messages?: WhatsAppMessage[];
  };
  error?: string;
}

/**
 * Fetch messages from the specified group chat using offset-based pagination
 */
type FetchOptions = {
  existingIds?: Set<string>;
};

export async function fetchGroupMessages(
  chatId: string,
  limit: number = 50,
  options?: FetchOptions
): Promise<WhatsAppMessage[]> {
  console.log(
    `Fetching messages from group chat: ${chatId} (target limit: ${limit})`
  );

  const allMessages: WhatsAppMessage[] = [];
  let offset = 0;
  let hasMore = true;
  const maxPerRequest = 100; // WHAPI hard limit
  const hoursAgo = Math.floor(
    (Date.now() - env.MESSAGE_FETCH_HOURS * 60 * 60 * 1000) / 1000
  );
  let requestIndex = 0;

  while (hasMore && allMessages.length < limit) {
    const currentLimit = Math.min(maxPerRequest, limit - allMessages.length);

    // Build URL with offset-based pagination and time filtering
    const url = `${env.WHAPI_BASE_URL}/messages/list/${encodeURIComponent(chatId)}?count=${currentLimit}&offset=${offset}&time_from=${hoursAgo}&sort=desc`;

    requestIndex += 1;
    console.log(
      `[WHAPI][REQ ${requestIndex}] GET ${url} (count=${currentLimit}, offset=${offset})`
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.WHAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract messages from response
    let messages: WhatsAppMessage[] = [];
    if (Array.isArray(data)) {
      messages = data;
    } else if (data.data && Array.isArray(data.data)) {
      messages = data.data;
    } else if (data.messages && Array.isArray(data.messages)) {
      messages = data.messages;
    } else {
      throw new Error(`API error: Unexpected response format`);
    }

    // If we got no messages, we're done
    if (messages.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`[WHAPI][RES ${requestIndex}] items=${messages.length}`);

    // Optional early-stop: if any message in this batch already exists, cut the batch at that point and stop
    if (options?.existingIds && options.existingIds.size > 0) {
      const idx = messages.findIndex(m => options.existingIds!.has(m.id));
      if (idx >= 0) {
        if (idx > 0) {
          allMessages.push(...messages.slice(0, idx));
        }
        hasMore = false;
        console.log(
          `Encountered existing message at index ${idx}; stopping further fetches`
        );
        break;
      }
    }

    allMessages.push(...messages);
    offset += messages.length;

    // If we got fewer messages than requested, we've reached the end
    if (messages.length < currentLimit) {
      hasMore = false;
    }

    console.log(
      `Fetched ${messages.length} messages in this batch (total: ${allMessages.length})`
    );

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`Total messages fetched: ${allMessages.length}`);
  return allMessages;
}

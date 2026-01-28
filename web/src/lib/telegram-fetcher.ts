/**
 * Telegram Bot API Fetcher
 * Fetches messages from Telegram channels using Bot API
 */

import { env } from './env';

interface TelegramMessage {
  message_id: number;
  date: number;
  chat: {
    id: number;
    title?: string;
    username?: string;
    type: string;
  };
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  text?: string;
  caption?: string;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
  document?: {
    file_id: string;
    file_unique_id: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

export class TelegramFetcher {
  private botToken: string;
  private apiUrl: string;

  constructor() {
    if (!env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }
    this.botToken = env.TELEGRAM_BOT_TOKEN;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Get file download URL from file_id
   */
  async getFileUrl(fileId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.apiUrl}/getFile?file_id=${fileId}`
      );
      const data: TelegramApiResponse<{ file_path: string }> =
        await response.json();

      if (!data.ok || !data.result) {
        return null;
      }

      return `https://api.telegram.org/file/bot${this.botToken}/${data.result.file_path}`;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }

  /**
   * Fetch messages from a channel for the last N hours
   */
  async fetchChannelMessages(
    channelId: string,
    hoursBack: number = 24
  ): Promise<TelegramMessage[]> {
    if (!env.TELEGRAM_CHANNEL_ID && !channelId) {
      throw new Error('TELEGRAM_CHANNEL_ID is not configured');
    }

    const targetChannel = channelId || env.TELEGRAM_CHANNEL_ID!;
    const allMessages: TelegramMessage[] = [];
    let offset = 0;
    const limit = 100; // Telegram API max per request
    const cutoffTime = Math.floor(
      (Date.now() - hoursBack * 60 * 60 * 1000) / 1000
    );

    console.log(
      `[Telegram] Fetching messages from channel: ${targetChannel} (last ${hoursBack} hours)`
    );

    while (true) {
      try {
        // Use getUpdates for bot messages or getChatHistory for channels
        // For channels, we need to use a different approach
        // Since we're parsing a channel, we'll use getUpdates and filter by chat
        const response = await fetch(
          `${this.apiUrl}/getUpdates?offset=${offset}&limit=${limit}&timeout=10`
        );

        const data: TelegramApiResponse<TelegramMessage[]> =
          await response.json();

        if (!data.ok || !data.result || data.result.length === 0) {
          break;
        }

        // Filter messages from the target channel and within time range
        const relevantMessages = data.result.filter(msg => {
          const chatId =
            msg.chat.username || msg.chat.id.toString();
          const matchesChannel =
            chatId === targetChannel ||
            chatId === `@${targetChannel}` ||
            msg.chat.id.toString() === targetChannel.replace('@', '');

          if (!matchesChannel) {
            return false;
          }

          // Check if message is within time range
          return msg.date >= cutoffTime;
        });

        allMessages.push(...relevantMessages);

        // Update offset for next request
        const lastUpdateId = data.result[data.result.length - 1]?.message_id;
        if (lastUpdateId) {
          offset = lastUpdateId + 1;
        } else {
          break;
        }

        // If we got fewer messages than requested, we've reached the end
        if (data.result.length < limit) {
          break;
        }

        // If the oldest message is before our cutoff, we can stop
        const oldestMessage = data.result[data.result.length - 1];
        if (oldestMessage && oldestMessage.date < cutoffTime) {
          break;
        }
      } catch (error) {
        console.error('[Telegram] Error fetching messages:', error);
        break;
      }
    }

    console.log(
      `[Telegram] Fetched ${allMessages.length} messages from channel ${targetChannel}`
    );
    return allMessages;
  }

  /**
   * Alternative: Fetch messages using forward_from_chat for channels
   * This method works better for public channels
   */
  async fetchChannelMessagesByUsername(
    channelUsername: string,
    hoursBack: number = 24
  ): Promise<TelegramMessage[]> {
    const allMessages: TelegramMessage[] = [];
    let offset = 0;
    const limit = 100;
    const cutoffTime = Math.floor(
      (Date.now() - hoursBack * 60 * 60 * 1000) / 1000
    );

    // Normalize channel username (remove @ if present)
    const normalizedUsername = channelUsername.replace('@', '');

    console.log(
      `[Telegram] Fetching messages from channel: @${normalizedUsername} (last ${hoursBack} hours)`
    );

    // For public channels, we can use getChat to get chat info first
    try {
      const chatResponse = await fetch(
        `${this.apiUrl}/getChat?chat_id=@${normalizedUsername}`
      );
      const chatData: TelegramApiResponse<any> = await chatResponse.json();

      if (!chatData.ok) {
        throw new Error(
          `Failed to get chat info: ${chatData.description || 'Unknown error'}`
        );
      }

      const chatId = chatData.result.id;

      // Now fetch updates and filter by chat_id
      while (true) {
        const response = await fetch(
          `${this.apiUrl}/getUpdates?offset=${offset}&limit=${limit}&timeout=10`
        );

        const data: TelegramApiResponse<TelegramMessage[]> =
          await response.json();

        if (!data.ok || !data.result || data.result.length === 0) {
          break;
        }

        // Filter messages from the target channel
        const relevantMessages = data.result.filter(msg => {
          if (msg.chat.id !== chatId) {
            return false;
          }

          // Check if message is within time range
          return msg.date >= cutoffTime;
        });

        allMessages.push(...relevantMessages);

        // Update offset
        const updates = data.result;
        if (updates.length > 0) {
          // getUpdates returns Update objects, not Message objects directly
          // We need to extract the message from the update
          const lastUpdate = updates[updates.length - 1];
          offset = (lastUpdate as any).update_id + 1;
        } else {
          break;
        }

        if (updates.length < limit) {
          break;
        }
      }
    } catch (error) {
      console.error('[Telegram] Error fetching channel messages:', error);
      throw error;
    }

    console.log(
      `[Telegram] Fetched ${allMessages.length} messages from channel @${normalizedUsername}`
    );
    return allMessages;
  }
}

export const telegramFetcher = new TelegramFetcher();

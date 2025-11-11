/**
 * Telegram Notification Service
 * Sends messages via Telegram Bot API
 */

import { env } from '../env';

interface TelegramConfig {
  botToken: string;
  chatIds: string[];
  enabled: boolean;
}

export class TelegramNotifier {
  private config: TelegramConfig;
  private apiUrl = 'https://api.telegram.org';

  constructor() {
    const botToken = env.TELEGRAM_BOT_TOKEN;
    const chatIdsStr = env.TELEGRAM_CHAT_IDS || '';
    const enabled = env.TELEGRAM_NOTIFICATIONS_ENABLED === 'true';

    this.config = {
      botToken: botToken || '',
      chatIds: chatIdsStr
        .split(',')
        .map(id => id.trim())
        .filter(Boolean),
      enabled: enabled && !!botToken && chatIdsStr.length > 0,
    };
  }

  /**
   * Check if Telegram notifications are configured and enabled
   */
  isConfigured(): boolean {
    return this.config.enabled;
  }

  /**
   * Send a message to all configured Telegram chat IDs
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.config.enabled) {
      console.log('📵 Telegram notifications disabled or not configured');
      return;
    }

    if (this.config.chatIds.length === 0) {
      console.log('📵 No Telegram chat IDs configured');
      return;
    }

    console.log(
      `📱 Sending Telegram notifications to ${this.config.chatIds.length} chat(s)...`
    );

    for (const chatId of this.config.chatIds) {
      try {
        await this.sendToChat(chatId, message);
        console.log(`✅ Telegram notification sent to chat ${chatId}`);
      } catch (error) {
        console.error(
          `❌ Failed to send Telegram notification to chat ${chatId}:`,
          error
        );
      }
    }
  }

  /**
   * Send a message to a specific Telegram chat
   */
  private async sendToChat(chatId: string, message: string): Promise<void> {
    const url = `${this.apiUrl}/bot${this.config.botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const result = await response.json();
    if (!result.ok) {
      throw new Error(
        `Telegram API returned error: ${JSON.stringify(result)}`
      );
    }
  }
}

/**
 * Get a singleton instance of TelegramNotifier
 */
let telegramNotifierInstance: TelegramNotifier | null = null;

export function getTelegramNotifier(): TelegramNotifier {
  if (!telegramNotifierInstance) {
    telegramNotifierInstance = new TelegramNotifier();
  }
  return telegramNotifierInstance;
}

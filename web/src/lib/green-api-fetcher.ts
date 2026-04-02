/**
 * Green API message fetcher utility
 * Handles fetching messages from WhatsApp groups using Green API
 */

import { env } from './env';
import { logger, logError, logServerError } from '@/lib/server/logger';
import type {
  GreenApiMessage,
  GreenApiChatHistoryResponse,
  GreenApiGetMessageResponse,
  GreenApiSettingsResponse,
  GreenApiChatHistoryParams,
  GreenApiGetMessageParams,
  GreenApiSetSettingsParams,
} from '../types/green-api';

export class GreenApiFetcher {
  private instanceId: string;
  private token: string;
  private baseUrl: string;

  constructor() {
    if (!env.GREEN_API_INSTANCE_ID || !env.GREEN_API_TOKEN) {
      throw new Error(
        'Green API credentials not configured. Please set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN environment variables.'
      );
    }

    this.instanceId = env.GREEN_API_INSTANCE_ID;
    this.token = env.GREEN_API_TOKEN;
    this.baseUrl = env.GREEN_API_BASE_URL || 'https://api.green-api.com';
  }

  /**
   * Get chat history from a group chat
   */
  async getChatHistory(
    params: GreenApiChatHistoryParams
  ): Promise<GreenApiMessage[]> {
    const url = `${this.baseUrl}/waInstance${this.instanceId}/getChatHistory/${this.token}`;

    logger.debug(
      `[Green API] Fetching chat history for ${params.chatId} (count: ${params.count || 50})`
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: params.chatId,
          count: params.count || 50,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Green API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Green API getChatHistory returns the messages directly or wrapped in a data array
      if (Array.isArray(data)) {
        logger.debug(
          `[Green API] Retrieved ${data.length} messages from ${params.chatId}`
        );
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        logger.debug(
          `[Green API] Retrieved ${data.data.length} messages from ${params.chatId}`
        );
        return data.data;
      } else {
        logError(
          'Green API getChatHistory response:',
          JSON.stringify(data, null, 2)
        );
        throw new Error(`Green API error: Unexpected response format`);
      }
    } catch (error) {
      logServerError(`[Green API] Error fetching chat history:`, error);
      throw error;
    }
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(params: GreenApiGetMessageParams): Promise<GreenApiMessage> {
    const url = `${this.baseUrl}/waInstance${this.instanceId}/getMessage/${this.token}`;

    logger.debug(
      `[Green API] Fetching message ${params.idMessage} from ${params.chatId}`
    );

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: params.chatId,
          idMessage: params.idMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Green API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Green API getMessage returns the message directly
      if (data.idMessage) {
        logger.debug(`[Green API] Retrieved message ${params.idMessage}`);
        return data;
      } else {
        logError(
          'Green API getMessage response:',
          JSON.stringify(data, null, 2)
        );
        throw new Error(`Green API error: Message not found`);
      }
    } catch (error) {
      logServerError(`[Green API] Error fetching message:`, error);
      throw error;
    }
  }

  /**
   * Get current settings
   */
  async getSettings(): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/waInstance${this.instanceId}/getSettings/${this.token}`;

    logger.debug(`[Green API] Fetching settings`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Green API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Green API getSettings returns the settings directly, not wrapped in a result object
      logger.debug(`[Green API] Retrieved settings`);
      return data;
    } catch (error) {
      logServerError(`[Green API] Error fetching settings:`, error);
      throw error;
    }
  }

  /**
   * Set instance settings
   */
  async setSettings(params: GreenApiSetSettingsParams): Promise<boolean> {
    const url = `${this.baseUrl}/waInstance${this.instanceId}/setSettings/${this.token}`;

    logger.debug(`[Green API] Setting instance settings`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(
          `Green API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Green API setSettings returns {"saveSettings": true} on success
      if (data.saveSettings === true) {
        logger.debug(`[Green API] Settings updated successfully`);
        return true;
      } else {
        logError(
          'Green API setSettings response:',
          JSON.stringify(data, null, 2)
        );
        throw new Error(`Green API error: Settings not saved`);
      }
    } catch (error) {
      logServerError(`[Green API] Error setting settings:`, error);
      throw error;
    }
  }

  /**
   * Enable required settings for message fetching
   */
  async enableMessageFetching(): Promise<boolean> {
    logger.debug(`[Green API] Enabling message fetching settings...`);

    const settings = {
      incomingWebhook: true,
      outgoingWebhook: true,
      outgoingMessageWebhook: true,
      markIncomingMessagesReaded: false,
      markIncomingMessagesReadedOnReply: false,
    };

    return await this.setSettings(settings);
  }

  /**
   * Check if instance is ready for message fetching
   */
  async isReady(): Promise<boolean> {
    try {
      const settings = await this.getSettings();

      // Check if required settings are enabled
      // Green API uses "yes"/"no" strings instead of booleans
      const requiredSettings = [
        'incomingWebhook',
        'outgoingWebhook',
        'outgoingMessageWebhook',
      ];

      const isReady = requiredSettings.every(
        setting => settings[setting] === 'yes'
      );

      logger.debug(`[Green API] Instance ready: ${isReady}`);
      return isReady;
    } catch (error) {
      logServerError(`[Green API] Error checking readiness:`, error);
      return false;
    }
  }

  /**
   * Fetch messages from a group chat with time-based filtering
   * Since Green API doesn't support pagination, we fetch once and filter by time
   */
  async fetchGroupMessagesWithTimeFilter(
    chatId: string,
    hoursAgo: number,
    maxMessages: number = 1000
  ): Promise<GreenApiMessage[]> {
    logger.debug(
      `[Green API] Fetching messages from group: ${chatId} (time filter: ${new Date(hoursAgo * 1000).toISOString()})`
    );

    try {
      // Fetch the maximum number of messages Green API allows (100)
      const messages = await this.getChatHistory({
        chatId,
        count: 100, // Green API max per request
      });

      if (messages.length === 0) {
        logger.debug(`[Green API] No messages found`);
        return [];
      }

      // Filter messages by time
      const recentMessages = messages.filter(msg => msg.timestamp >= hoursAgo);

      logger.debug(
        `[Green API] Fetched ${messages.length} total messages, ${recentMessages.length} within time filter`
      );

      return recentMessages;
    } catch (error) {
      logServerError(`[Green API] Error fetching messages:`, error);
      return [];
    }
  }

  /**
   * Fetch messages from a group chat with pagination
   */
  async fetchGroupMessages(
    chatId: string,
    limit: number = 50,
    options?: {
      existingIds?: Set<string>;
      maxMessages?: number;
    }
  ): Promise<GreenApiMessage[]> {
    logger.debug(
      `[Green API] Fetching messages from group: ${chatId} (limit: ${limit})`
    );

    const allMessages: GreenApiMessage[] = [];
    let hasMore = true;
    const count = Math.min(limit, 100); // Green API max per request is 100
    const maxMessages = options?.maxMessages || 10000;
    const existingIds = options?.existingIds || new Set();

    while (
      hasMore &&
      allMessages.length < limit &&
      allMessages.length < maxMessages
    ) {
      try {
        const messages = await this.getChatHistory({
          chatId,
          count,
        });

        if (messages.length === 0) {
          hasMore = false;
          break;
        }

        // Filter out existing messages
        const newMessages = messages.filter(
          msg => !existingIds.has(msg.idMessage)
        );

        allMessages.push(...newMessages);

        logger.debug(
          `[Green API] Fetched ${messages.length} messages, ${newMessages.length} new (total: ${allMessages.length})`
        );

        // If we got fewer messages than requested, we've reached the end
        if (messages.length < count) {
          hasMore = false;
        }

        // If we hit existing messages, we can stop
        if (newMessages.length < messages.length) {
          hasMore = false;
        }
      } catch (error) {
        logServerError(`[Green API] Error fetching messages:`, error);
        hasMore = false;
      }
    }

    logger.debug(`[Green API] Total messages fetched: ${allMessages.length}`);
    return allMessages;
  }

  /**
   * Download file and get download URL
   */
  async downloadFile(
    messageId: string,
    chatId: string
  ): Promise<string | null> {
    const url = `${this.baseUrl}/waInstance${this.instanceId}/downloadFile/${this.token}`;

    logger.debug(`[Green API] Downloading file for message ${messageId}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idMessage: messageId,
          chatId: chatId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Green API downloadFile request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.downloadUrl) {
        logger.debug(`[Green API] Downloaded file URL: ${data.downloadUrl}`);
        return data.downloadUrl;
      } else if (data.url) {
        logger.debug(`[Green API] Downloaded file URL: ${data.url}`);
        return data.url;
      } else {
        logger.debug(`[Green API] No download URL in response:`, data);
        return null;
      }
    } catch (error) {
      logServerError(`[Green API] Error downloading file:`, error);
      return null;
    }
  }

  /**
   * Convert Green API message to WhatsApp message format (compatible with existing system)
   */
  convertToWhatsAppMessage(greenMessage: GreenApiMessage): any {
    return {
      id: greenMessage.idMessage,
      timestamp: greenMessage.timestamp,
      type: greenMessage.typeMessage,
      chatId: greenMessage.chatId,
      from: greenMessage.senderId,
      from_name: greenMessage.senderName,
      text: greenMessage.textMessage,
      downloadUrl: greenMessage.downloadUrl,
      caption: greenMessage.caption,
      fileName: greenMessage.fileName,
      fileSize: greenMessage.fileSize,
      mimeType: greenMessage.mimeType,
      quotedMessageId: greenMessage.quotedMessageId,
      quotedMessage: greenMessage.quotedMessage,
      forwarded: greenMessage.forwarded,
      forwardedFrom: greenMessage.forwardedFrom,
      forwardedFromName: greenMessage.forwardedFromName,
      forwardedTimestamp: greenMessage.forwardedTimestamp,
      isForwarded: greenMessage.isForwarded,
      isGroup: greenMessage.isGroup,
      groupName: greenMessage.groupName,
      groupParticipants: greenMessage.groupParticipants,
      isFromMe: greenMessage.isFromMe,
      isSystemMessage: greenMessage.isSystemMessage,
      systemMessageType: greenMessage.systemMessageType,
      systemMessageData: greenMessage.systemMessageData,
      location: greenMessage.location,
      contact: greenMessage.contact,
      poll: greenMessage.poll,
      pollVote: greenMessage.pollVote,
      reaction: greenMessage.reaction,
      replyTo: greenMessage.replyTo,
      mentions: greenMessage.mentions,
      hasQuotedMsg: greenMessage.hasQuotedMsg,
      quotedMsg: greenMessage.quotedMsg,
      mediaData: greenMessage.mediaData,
      contextInfo: greenMessage.contextInfo,
    };
  }
}

// Export a singleton instance
export const greenApiFetcher = new GreenApiFetcher();

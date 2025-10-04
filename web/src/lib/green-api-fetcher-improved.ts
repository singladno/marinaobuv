/**
 * Improved Green API message fetcher utility with proper pagination
 * Handles fetching ALL messages from WhatsApp groups using Green API with time-based filtering
 */

import { env } from './env';
import type {
  GreenApiMessage,
  GreenApiChatHistoryParams,
  GreenApiGetMessageParams,
  GreenApiSetSettingsParams,
} from '../types/green-api';

export class GreenApiFetcherImproved {
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

    console.log(
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
        console.log(
          `[Green API] Retrieved ${data.length} messages from ${params.chatId}`
        );
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        console.log(
          `[Green API] Retrieved ${data.data.length} messages from ${params.chatId}`
        );
        return data.data;
      } else {
        console.error(
          'Green API getChatHistory response:',
          JSON.stringify(data, null, 2)
        );
        throw new Error(`Green API error: Unexpected response format`);
      }
    } catch (error) {
      console.error(`[Green API] Error fetching chat history:`, error);
      throw error;
    }
  }

  /**
   * Get current settings
   */
  async getSettings(): Promise<Record<string, any>> {
    const url = `${this.baseUrl}/waInstance${this.instanceId}/getSettings/${this.token}`;

    console.log(`[Green API] Fetching settings`);

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
      console.log(`[Green API] Retrieved settings`);
      return data;
    } catch (error) {
      console.error(`[Green API] Error fetching settings:`, error);
      throw error;
    }
  }

  /**
   * Set instance settings
   */
  async setSettings(params: GreenApiSetSettingsParams): Promise<boolean> {
    const url = `${this.baseUrl}/waInstance${this.instanceId}/setSettings/${this.token}`;

    console.log(`[Green API] Setting instance settings`);

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
        console.log(`[Green API] Settings updated successfully`);
        return true;
      } else {
        console.error(
          'Green API setSettings response:',
          JSON.stringify(data, null, 2)
        );
        throw new Error(`Green API error: Settings not saved`);
      }
    } catch (error) {
      console.error(`[Green API] Error setting settings:`, error);
      throw error;
    }
  }

  /**
   * Enable required settings for message fetching
   */
  async enableMessageFetching(): Promise<boolean> {
    console.log(`[Green API] Enabling message fetching settings...`);

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

      console.log(`[Green API] Instance ready: ${isReady}`);
      return isReady;
    } catch (error) {
      console.error(`[Green API] Error checking readiness:`, error);
      return false;
    }
  }

  /**
   * Fetch ALL messages from a group chat within a time range using pagination
   * This method fetches messages in batches and continues until we reach the time limit
   */
  async fetchGroupMessagesWithTimeFilter(
    chatId: string,
    hoursAgo: number,
    maxMessages: number = 10000
  ): Promise<GreenApiMessage[]> {
    console.log(
      `[Green API] Fetching ALL messages from group: ${chatId} (time filter: ${new Date(hoursAgo * 1000).toISOString()})`
    );

    const allMessages: GreenApiMessage[] = [];
    let hasMore = true;
    let requestCount = 0;
    const maxRequests = Math.ceil(maxMessages / 100); // Prevent infinite loops

    while (
      hasMore &&
      allMessages.length < maxMessages &&
      requestCount < maxRequests
    ) {
      try {
        requestCount++;
        console.log(`[Green API] Fetching batch ${requestCount}...`);

        // Fetch 100 messages (Green API max per request)
        const messages = await this.getChatHistory({
          chatId,
          count: 100,
        });

        if (messages.length === 0) {
          console.log(`[Green API] No more messages available`);
          hasMore = false;
          break;
        }

        // Filter messages by time
        const recentMessages = messages.filter(
          msg => msg.timestamp >= hoursAgo
        );

        // Add filtered messages to our collection
        allMessages.push(...recentMessages);

        console.log(
          `[Green API] Batch ${requestCount}: ${messages.length} total, ${recentMessages.length} within time filter (total: ${allMessages.length})`
        );

        // Check if we've reached messages older than our time filter
        const oldestMessage = messages[messages.length - 1];
        if (oldestMessage.timestamp < hoursAgo) {
          console.log(
            `[Green API] Reached messages older than time filter, stopping`
          );
          hasMore = false;
        }

        // If we got fewer messages than requested, we've reached the end
        if (messages.length < 100) {
          console.log(`[Green API] Reached end of message history`);
          hasMore = false;
        }

        // Add delay to respect Green API rate limit (1 request per second)
        if (hasMore) {
          console.log(`[Green API] Waiting 1 second before next request...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(
          `[Green API] Error fetching batch ${requestCount}:`,
          error
        );
        hasMore = false;
      }
    }

    console.log(
      `[Green API] Completed fetching: ${allMessages.length} messages within time filter (${requestCount} requests)`
    );

    return allMessages;
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
export const greenApiFetcherImproved = new GreenApiFetcherImproved();

/**
 * Telegram MTProto Fetcher
 * Uses user account to fetch messages from Telegram channels via MTProto
 * This allows direct access to channels the user is subscribed to
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { env } from './env';

interface TelegramMessageData {
  message_id: number;
  date: number;
  type?: string;
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
  mediaUrl?: string;
  mediaBuffer?: Buffer; // Store downloaded image buffer for S3 upload
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
}

export class TelegramMTProtoFetcher {
  private client: TelegramClient | null = null;
  private apiId: number;
  private apiHash: string;
  private phone: string;
  private sessionString: string | null;
  private channelEntityCache: Map<string, any> = new Map(); // Cache resolved channel entities

  constructor() {
    if (!env.TELEGRAM_API_ID || !env.TELEGRAM_API_HASH) {
      throw new Error(
        'TELEGRAM_API_ID and TELEGRAM_API_HASH must be configured. Get them from https://my.telegram.org/apps'
      );
    }

    if (!env.TELEGRAM_PHONE) {
      throw new Error('TELEGRAM_PHONE must be configured (e.g., +1234567890)');
    }

    this.apiId = parseInt(env.TELEGRAM_API_ID, 10);
    this.apiHash = env.TELEGRAM_API_HASH;
    this.phone = env.TELEGRAM_PHONE;
    this.sessionString = env.TELEGRAM_SESSION_STRING || null;
  }

  /**
   * Initialize and connect the Telegram client
   */
  async connect(): Promise<void> {
    if (this.client && this.client.connected) {
      return;
    }

    const stringSession = new StringSession(this.sessionString || '');
    this.client = new TelegramClient(stringSession, this.apiId, this.apiHash, {
      connectionRetries: 5,
    });

    await this.client.connect();

    // If not authorized, we need to authenticate
    if (!(await this.client.checkAuthorization())) {
      console.log('[Telegram MTProto] Not authorized. Starting authentication...');
      await this.client.sendCode(
        {
          apiId: this.apiId,
          apiHash: this.apiHash,
        },
        this.phone
      );

      // In interactive mode, we'd prompt for the code
      // For non-interactive, we need the code from environment or user input
      const code = process.env.TELEGRAM_AUTH_CODE;
      if (!code) {
        throw new Error(
          'TELEGRAM_AUTH_CODE is required for first-time authentication. ' +
            'Run the script interactively or set TELEGRAM_AUTH_CODE in environment.'
        );
      }

      await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: this.phone,
          phoneCodeHash: '', // This should come from sendCode response
          phoneCode: code,
        })
      );

      // Save session string for future use
      const newSessionString = this.client.session.save() as unknown as string;
      console.log(
        `[Telegram MTProto] Session string (save this to TELEGRAM_SESSION_STRING): ${newSessionString}`
      );
    } else {
      console.log('[Telegram MTProto] Already authorized');
    }
  }

  /**
   * Disconnect the client
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  /**
   * Get file download URL for a media message
   */
  async getMediaUrl(message: Api.Message): Promise<string | null> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    if (!message.media) {
      return null;
    }

    try {
      // Download media to buffer and return as data URL or save to temp file
      // For now, we'll return the file reference
      const media = message.media;
      if (media instanceof Api.MessageMediaPhoto) {
        // For photos, we can get the file reference
        return `photo_${message.id}`;
      } else if (media instanceof Api.MessageMediaDocument) {
        return `document_${message.id}`;
      }
    } catch (error) {
      console.error('[Telegram MTProto] Error getting media URL:', error);
    }

    return null;
  }

  /**
   * Fetch messages from a channel for the last N hours
   */
  async fetchChannelMessages(
    channelUsername: string,
    hoursBack: number = 24
  ): Promise<TelegramMessageData[]> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) {
      throw new Error('Failed to connect to Telegram');
    }

    const cutoffTime = Math.floor(
      (Date.now() - hoursBack * 60 * 60 * 1000) / 1000
    );

    // Normalize channel username (remove @ if present)
    const normalizedUsername = channelUsername.replace('@', '');

    console.log(
      `[Telegram MTProto] Fetching messages from channel: @${normalizedUsername} (last ${hoursBack} hours)`
    );

    try {
      // Resolve the channel entity
      // Check if it's a numeric ID (starts with -100) or username
      let entity;
      if (normalizedUsername.startsWith('-100') || /^-?\d+$/.test(normalizedUsername)) {
        // It's a channel ID - find it in dialogs
        const dialogs = await this.client.getDialogs();
        const channelIdStr = normalizedUsername.replace('-100', '');

        // Try to find by ID
        const dialog = dialogs.find(d => {
          if (d.isChannel && d.entity) {
            const entityId = (d.entity as any).id;
            if (entityId) {
              // Channel ID format: -100 + channel_id
              return entityId.toString() === channelIdStr;
            }
          }
          return false;
        });

        if (dialog && dialog.entity) {
          entity = dialog.entity;
        } else {
          throw new Error(`Channel with ID ${normalizedUsername} not found in your dialogs. Make sure you're subscribed to it.`);
        }
      } else {
        // It's a username - try to get entity directly
        try {
          entity = await this.client.getEntity(normalizedUsername);
        } catch (e) {
          // If that fails, try to find it in dialogs by name
          const dialogs = await this.client.getDialogs();
          const dialog = dialogs.find(d => {
            if (d.isChannel) {
              const username = (d.entity as any).username;
              return username === normalizedUsername || d.title === normalizedUsername;
            }
            return false;
          });

          if (dialog && dialog.entity) {
            entity = dialog.entity;
          } else {
            throw new Error(`Channel @${normalizedUsername} not found. Make sure you're subscribed to it.`);
          }
        }
      }

      if (!entity) {
        throw new Error(`Channel ${normalizedUsername} not found. Make sure you're subscribed to it.`);
      }

      // Cache the entity for future use (to avoid repeated getDialogs calls)
      this.channelEntityCache.set(normalizedUsername, entity);

      const allMessages: TelegramMessageData[] = [];
      let offsetId = 0;
      const limit = 100;

      while (true) {
        // Fetch messages from the channel
        const messages = await this.client.getMessages(entity, {
          limit,
          offsetId,
        });

        if (messages.length === 0) {
          break;
        }

        // Process messages
        for (const msg of messages) {
          if (!(msg instanceof Api.Message)) {
            continue;
          }

          // Check if message is within time range
          // msg.date can be a Date object or a number (timestamp)
          let messageDate = 0;
          if (msg.date) {
            if (typeof msg.date === 'object' && 'getTime' in msg.date) {
              messageDate = (msg.date as Date).getTime() / 1000;
            } else if (typeof msg.date === 'number') {
              messageDate = msg.date;
            }
          }
          if (messageDate < cutoffTime) {
            // We've reached messages older than our cutoff
            return allMessages;
          }

          // Extract message data
          const messageData: TelegramMessageData = {
            message_id: msg.id,
            date: messageDate,
            chat: {
              id: entity.id instanceof Api.PeerChannel
                ? Number(entity.id.channelId)
                : (entity instanceof Api.Channel || entity instanceof Api.Chat)
                  ? Number((entity as any).id)
                  : 0,
              username: normalizedUsername,
              type: 'channel',
            },
            text: msg.message || undefined,
            caption: msg.media instanceof Api.MessageMediaPhoto
              ? (msg.media as any).caption?.text || undefined
              : undefined,
          };

          // Extract sender info if available
          if (msg.fromId) {
            try {
              const sender = await this.client.getEntity(msg.fromId);
              if (sender) {
                messageData.from = {
                  id: sender.id instanceof Api.PeerUser
                    ? Number(sender.id.userId)
                    : (sender instanceof Api.User)
                      ? Number((sender as any).id)
                      : 0,
                  is_bot: sender instanceof Api.User ? (sender.bot ?? false) : false,
                  first_name: sender instanceof Api.User ? (sender.firstName ?? '') : '',
                  last_name: sender instanceof Api.User ? sender.lastName : undefined,
                  username: sender instanceof Api.User ? sender.username : undefined,
                };
              }
            } catch (error) {
              // Ignore errors getting sender info
            }
          }

          // Handle media
          if (msg.media) {
            if (msg.media instanceof Api.MessageMediaPhoto) {
              messageData.type = 'photo';
              // Get photo file reference
              const photo = msg.media.photo;
              if (photo instanceof Api.Photo) {
                // Get the largest photo size
                const sizes = photo.sizes;
                if (sizes && sizes.length > 0) {
                  const largestSize = sizes[sizes.length - 1];
                  if (largestSize instanceof Api.PhotoSize) {
                    messageData.photo = [
                      {
                        file_id: `photo_${msg.id}`,
                        file_unique_id: photo.id.toString(),
                        width: largestSize.w,
                        height: largestSize.h,
                        file_size: largestSize.size,
                      },
                    ];

                    // Download the image immediately for S3 upload
                    try {
                      const buffer = await this.client.downloadMedia(msg, {});
                      if (buffer && Buffer.isBuffer(buffer)) {
                        messageData.mediaBuffer = buffer;
                        messageData.mediaUrl = `telegram_photo_${msg.id}`; // Placeholder, will be replaced with S3 URL
                        console.log(`[Telegram MTProto] Downloaded photo for message ${msg.id} (${buffer.length} bytes)`);
                      }
                    } catch (error) {
                      // Download failed, but mark as photo anyway
                      messageData.mediaUrl = `telegram_photo_${msg.id}`;
                      console.log(`[Telegram MTProto] Photo detected for ${msg.id}, download failed:`, error);
                    }
                  }
                }
              }
            } else if (msg.media instanceof Api.MessageMediaDocument) {
              messageData.type = 'document';
              const doc = msg.media.document;
              if (doc instanceof Api.Document) {
                messageData.mediaUrl = `telegram_document_${msg.id}`;
              }
            }
          } else {
            messageData.type = 'text';
          }

          allMessages.push(messageData);

          // Update offset for next batch
          offsetId = msg.id;
        }

        // If we got fewer messages than requested, we've reached the end
        if (messages.length < limit) {
          break;
        }
      }

      console.log(
        `[Telegram MTProto] Fetched ${allMessages.length} messages from channel @${normalizedUsername}`
      );

      return allMessages;
    } catch (error) {
      console.error('[Telegram MTProto] Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Download media from a message by message ID
   */
  async downloadMediaByMessageId(
    channelId: string,
    messageId: number
  ): Promise<Buffer | null> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) {
      throw new Error('Failed to connect to Telegram');
    }

    try {
      // Normalize channel username (remove @ if present)
      const normalizedChannelId = channelId.replace('@', '');

      // Check cache first to avoid getDialogs() calls
      let entity = this.channelEntityCache.get(normalizedChannelId);

      if (!entity) {
        // Entity not in cache, resolve it (but avoid getDialogs if possible)
        if (normalizedChannelId.startsWith('-100') || /^-?\d+$/.test(normalizedChannelId)) {
          // For numeric IDs, try getEntity first (faster, no flood wait)
          try {
            entity = await this.client.getEntity(normalizedChannelId);
            this.channelEntityCache.set(normalizedChannelId, entity);
          } catch (e) {
            // Fallback to getDialogs only if getEntity fails
            const channelIdStr = normalizedChannelId.replace('-100', '');
            const dialogs = await this.client.getDialogs();
            const dialog = dialogs.find(d => {
              if (d.isChannel && d.entity) {
                const entityId = (d.entity as any).id;
                if (entityId) {
                  return entityId.toString() === channelIdStr;
                }
              }
              return false;
            });

            if (dialog && dialog.entity) {
              entity = dialog.entity;
              this.channelEntityCache.set(normalizedChannelId, entity);
            } else {
              throw new Error(`Channel with ID ${normalizedChannelId} not found in your dialogs. Make sure you're subscribed to it.`);
            }
          }
        } else {
          // It's a username - try to get entity directly (no getDialogs needed)
          try {
            entity = await this.client.getEntity(normalizedChannelId);
            this.channelEntityCache.set(normalizedChannelId, entity);
          } catch (e) {
            throw new Error(`Channel @${normalizedChannelId} not found. Make sure you're subscribed to it.`);
          }
        }
      }

      if (!entity) {
        throw new Error(`Channel ${normalizedChannelId} not found. Make sure you're subscribed to it.`);
      }

      // Get the message
      const messages = await this.client.getMessages(entity, {
        ids: [messageId],
      });

      if (!messages || messages.length === 0) {
        console.log(`⚠️ Could not find message ${messageId} in channel`);
        return null;
      }

      const message = messages[0];
      if (!message.media) {
        console.log(`⚠️ Message ${messageId} has no media`);
        return null;
      }

      // Download the media
      const buffer = await this.client.downloadMedia(message, {});

      if (buffer && Buffer.isBuffer(buffer)) {
        return buffer;
      }

      return null;
    } catch (error) {
      console.error(
        `[Telegram MTProto] Error downloading media for message ${messageId}:`,
        error
      );
      return null;
    }
  }
}

export const telegramMTProtoFetcher = new TelegramMTProtoFetcher();

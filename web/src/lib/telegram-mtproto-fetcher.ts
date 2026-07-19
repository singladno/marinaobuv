/**
 * Telegram MTProto Fetcher
 * Uses user account to fetch messages from Telegram channels via MTProto
 * This allows direct access to channels the user is subscribed to
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { env } from './env';
import { logger, logServerError } from '@/lib/server/logger';

export interface TelegramMessageData {
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
  mediaBuffer?: Buffer;
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
  }>;
}

export type FetchChannelOptions = {
  hoursBack?: number;
  /** When true, walk the entire channel history. */
  fetchAll?: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function messageDateSeconds(msg: Api.Message): number {
  if (!msg.date) return 0;
  if (typeof msg.date === 'object' && 'getTime' in msg.date) {
    return (msg.date as Date).getTime() / 1000;
  }
  if (typeof msg.date === 'number') return msg.date;
  return 0;
}

export class TelegramMTProtoFetcher {
  private client: TelegramClient | null = null;
  private apiId: number;
  private apiHash: string;
  private phone: string;
  private sessionString: string | null;
  private channelEntityCache: Map<string, any> = new Map();

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

  async connect(): Promise<void> {
    if (this.client && this.client.connected) {
      return;
    }

    const stringSession = new StringSession(this.sessionString || '');
    this.client = new TelegramClient(stringSession, this.apiId, this.apiHash, {
      connectionRetries: 5,
      requestRetries: 5,
      downloadRetries: 5,
    });

    await this.client.connect();

    if (!(await this.client.checkAuthorization())) {
      logger.debug(
        '[Telegram MTProto] Not authorized. Starting authentication...'
      );
      await this.client.sendCode(
        {
          apiId: this.apiId,
          apiHash: this.apiHash,
        },
        this.phone
      );

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
          phoneCodeHash: '',
          phoneCode: code,
        })
      );

      const newSessionString = this.client.session.save() as unknown as string;
      logger.debug(
        `[Telegram MTProto] Session string (save this to TELEGRAM_SESSION_STRING): ${newSessionString}`
      );
    } else {
      logger.debug('[Telegram MTProto] Already authorized');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  private async resolveChannelEntity(channelUsername: string): Promise<any> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    const normalizedUsername = channelUsername.replace('@', '');
    const cached = this.channelEntityCache.get(normalizedUsername);
    if (cached) return cached;

    let entity;
    if (
      normalizedUsername.startsWith('-100') ||
      /^-?\d+$/.test(normalizedUsername)
    ) {
      const dialogs = await this.client.getDialogs();
      const channelIdStr = normalizedUsername.replace('-100', '');
      const dialog = dialogs.find(d => {
        if (d.isChannel && d.entity) {
          const entityId = (d.entity as any).id;
          if (entityId) {
            return entityId.toString() === channelIdStr;
          }
        }
        return false;
      });

      if (dialog?.entity) {
        entity = dialog.entity;
      } else {
        throw new Error(
          `Channel with ID ${normalizedUsername} not found in your dialogs. Make sure you're subscribed to it.`
        );
      }
    } else {
      try {
        entity = await this.client.getEntity(normalizedUsername);
      } catch {
        const dialogs = await this.client.getDialogs();
        const dialog = dialogs.find(d => {
          if (d.isChannel) {
            const username = (d.entity as any).username;
            return (
              username === normalizedUsername || d.title === normalizedUsername
            );
          }
          return false;
        });

        if (dialog?.entity) {
          entity = dialog.entity;
        } else {
          throw new Error(
            `Channel @${normalizedUsername} not found. Make sure you're subscribed to it.`
          );
        }
      }
    }

    if (!entity) {
      throw new Error(
        `Channel ${normalizedUsername} not found. Make sure you're subscribed to it.`
      );
    }

    this.channelEntityCache.set(normalizedUsername, entity);
    return entity;
  }

  private async mapApiMessage(
    msg: Api.Message,
    entity: any,
    normalizedUsername: string
  ): Promise<TelegramMessageData> {
    const messageData: TelegramMessageData = {
      message_id: msg.id,
      date: messageDateSeconds(msg),
      chat: {
        id:
          entity.id instanceof Api.PeerChannel
            ? Number(entity.id.channelId)
            : entity instanceof Api.Channel || entity instanceof Api.Chat
              ? Number((entity as any).id)
              : 0,
        username: normalizedUsername,
        type: 'channel',
      },
      text: msg.message || undefined,
      caption:
        msg.media instanceof Api.MessageMediaPhoto
          ? (msg.media as any).caption?.text || undefined
          : undefined,
    };

    if (msg.fromId && this.client) {
      try {
        const sender = await this.client.getEntity(msg.fromId);
        if (sender) {
          messageData.from = {
            id:
              sender.id instanceof Api.PeerUser
                ? Number(sender.id.userId)
                : sender instanceof Api.User
                  ? Number((sender as any).id)
                  : 0,
            is_bot: sender instanceof Api.User ? (sender.bot ?? false) : false,
            first_name:
              sender instanceof Api.User ? (sender.firstName ?? '') : '',
            last_name: sender instanceof Api.User ? sender.lastName : undefined,
            username: sender instanceof Api.User ? sender.username : undefined,
          };
        }
      } catch {
        // Ignore sender lookup errors
      }
    }

    // Metadata only — media bytes are downloaded later, per product.
    if (msg.media instanceof Api.MessageMediaPhoto) {
      messageData.type = 'photo';
      messageData.mediaUrl = `telegram_photo_${msg.id}`;
      const photo = msg.media.photo;
      if (photo instanceof Api.Photo) {
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
          }
        }
      }
    } else if (msg.media instanceof Api.MessageMediaDocument) {
      messageData.type = 'document';
      messageData.mediaUrl = `telegram_document_${msg.id}`;
    } else if (!msg.media) {
      messageData.type = 'text';
    }

    return messageData;
  }

  /**
   * Yield channel messages page-by-page (metadata only, no media download).
   * Newest → oldest. Stops when time window ends or history is exhausted.
   */
  async *iterateChannelMessageBatches(
    channelUsername: string,
    hoursBackOrOptions: number | FetchChannelOptions = 24
  ): AsyncGenerator<TelegramMessageData[], void, unknown> {
    if (!this.client) {
      await this.connect();
    }
    if (!this.client) {
      throw new Error('Failed to connect to Telegram');
    }

    const options: FetchChannelOptions =
      typeof hoursBackOrOptions === 'number'
        ? { hoursBack: hoursBackOrOptions, fetchAll: false }
        : {
            hoursBack: hoursBackOrOptions.hoursBack ?? 24,
            fetchAll: hoursBackOrOptions.fetchAll ?? false,
          };

    const cutoffTime = options.fetchAll
      ? 0
      : Math.floor(
          (Date.now() - (options.hoursBack ?? 24) * 60 * 60 * 1000) / 1000
        );

    const normalizedUsername = channelUsername.replace('@', '');
    console.log(
      options.fetchAll
        ? `[Telegram MTProto] Listing ALL messages from @${normalizedUsername} (metadata only)...`
        : `[Telegram MTProto] Listing messages from @${normalizedUsername} (last ${options.hoursBack}h, metadata only)...`
    );

    const entity = await this.resolveChannelEntity(normalizedUsername);
    let offsetId = 0;
    const limit = 100;
    let total = 0;

    while (true) {
      const messages = await this.client.getMessages(entity, {
        limit,
        offsetId,
      });

      if (messages.length === 0) break;

      const batch: TelegramMessageData[] = [];
      let hitCutoff = false;

      for (const msg of messages) {
        if (!(msg instanceof Api.Message)) continue;

        const date = messageDateSeconds(msg);
        if (!options.fetchAll && date < cutoffTime) {
          hitCutoff = true;
          break;
        }

        batch.push(await this.mapApiMessage(msg, entity, normalizedUsername));
        offsetId = msg.id;
      }

      if (batch.length > 0) {
        total += batch.length;
        console.log(
          `[Telegram MTProto] Listed ${total} messages (page ${batch.length})...`
        );
        yield batch;
      }

      if (hitCutoff || messages.length < limit) break;
    }

    console.log(
      `[Telegram MTProto] Done listing @${normalizedUsername}: ${total} messages`
    );
  }

  /**
   * Fetch all matching messages (metadata only). Prefer iterate + process for backfill.
   */
  async fetchChannelMessages(
    channelUsername: string,
    hoursBackOrOptions: number | FetchChannelOptions = 24
  ): Promise<TelegramMessageData[]> {
    const all: TelegramMessageData[] = [];
    for await (const batch of this.iterateChannelMessageBatches(
      channelUsername,
      hoursBackOrOptions
    )) {
      all.push(...batch);
    }
    return all;
  }

  /**
   * Download media for one message. Retries on TIMEOUT / transient errors.
   */
  async downloadMediaByMessageId(
    channelId: string,
    messageId: number,
    maxAttempts: number = 4
  ): Promise<Buffer | null> {
    if (!this.client) {
      await this.connect();
    }
    if (!this.client) {
      throw new Error('Failed to connect to Telegram');
    }

    const normalizedChannelId = channelId.replace('@', '');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const entity = await this.resolveChannelEntity(normalizedChannelId);
        const messages = await this.client.getMessages(entity, {
          ids: [messageId],
        });

        if (!messages || messages.length === 0) {
          logger.debug(`⚠️ Could not find message ${messageId} in channel`);
          return null;
        }

        const message = messages[0];
        if (!message.media) {
          logger.debug(`⚠️ Message ${messageId} has no media`);
          return null;
        }

        const buffer = await this.client.downloadMedia(message, {});
        if (buffer && Buffer.isBuffer(buffer)) {
          return buffer;
        }
        return null;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const retryable =
          /TIMEOUT|FLOOD|CONNECTION|NETWORK|DISCONNECT/i.test(msg) ||
          msg === 'TIMEOUT';

        if (attempt < maxAttempts && retryable) {
          const delayMs = 1500 * attempt;
          console.log(
            `[Telegram MTProto] Download msg ${messageId} attempt ${attempt}/${maxAttempts} failed (${msg}), retry in ${delayMs}ms...`
          );
          await sleep(delayMs);
          continue;
        }

        logServerError(
          `[Telegram MTProto] Error downloading media for message ${messageId}:`,
          error
        );
        return null;
      }
    }

    return null;
  }
}

export const telegramMTProtoFetcher = new TelegramMTProtoFetcher();

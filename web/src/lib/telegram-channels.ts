/**
 * Telegram channel sources for product parsing.
 * Supports multiple channels with per-channel parser profiles (flowers | cosmetics).
 */

import { env } from './env';

export type TelegramParserProfile = 'flowers' | 'cosmetics';

export interface TelegramChannelConfig {
  /** Channel username (@name) or numeric id (-100...) */
  id: string;
  profile: TelegramParserProfile;
  /** Admin UI label */
  name: string;
}

const PROFILE_DEFAULT_NAMES: Record<TelegramParserProfile, string> = {
  flowers: 'Telegram — цветы',
  cosmetics: 'Telegram — косметика',
};

/** Normalize channel id: ensure @ for usernames; keep numeric / -100 ids as-is. */
export function normalizeChannelId(channelId: string): string {
  const trimmed = channelId.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('@')) return trimmed;
  if (trimmed.startsWith('-100') || /^-?\d+$/.test(trimmed)) return trimmed;
  return `@${trimmed}`;
}

function isProfile(value: string): value is TelegramParserProfile {
  return value === 'flowers' || value === 'cosmetics';
}

/**
 * Parse TELEGRAM_CHANNELS env.
 * Format: @channel1:flowers,@dilshod_cosmetica:cosmetics
 * Optional label: @dilshod_cosmetica:cosmetics:SABBI
 * Falls back to TELEGRAM_CHANNEL_ID with profile "flowers".
 */
export function getTelegramChannels(): TelegramChannelConfig[] {
  const raw = env.TELEGRAM_CHANNELS;
  if (raw && raw.length > 0) {
    return raw.map(entry => {
      const parts = entry
        .split(':')
        .map(p => p.trim())
        .filter(Boolean);
      if (parts.length < 2) {
        throw new Error(
          `Invalid TELEGRAM_CHANNELS entry "${entry}". Expected id:profile or id:profile:name`
        );
      }
      const id = normalizeChannelId(parts[0]);
      const profileRaw = parts[1].toLowerCase();
      if (!isProfile(profileRaw)) {
        throw new Error(
          `Invalid Telegram parser profile "${parts[1]}" for ${id}. Use flowers or cosmetics`
        );
      }
      const name =
        parts.slice(2).join(':') ||
        (profileRaw === 'cosmetics'
          ? 'SABBI Косметика'
          : PROFILE_DEFAULT_NAMES[profileRaw]);
      return { id, profile: profileRaw, name };
    });
  }

  if (env.TELEGRAM_CHANNEL_ID) {
    return [
      {
        id: normalizeChannelId(env.TELEGRAM_CHANNEL_ID),
        profile: 'flowers',
        name: '32-61/63 Telegram',
      },
    ];
  }

  return [];
}

export function getTelegramChannelById(
  channelId: string
): TelegramChannelConfig | undefined {
  const normalized = normalizeChannelId(channelId);
  return getTelegramChannels().find(
    c => normalizeChannelId(c.id) === normalized
  );
}

#!/usr/bin/env tsx

/**
 * List all Telegram chats and channels
 * This helps you find the channel ID for TELEGRAM_CHANNEL_ID
 *
 * Usage: npx tsx scripts/list-telegram-chats.ts
 */

import '../src/scripts/load-env';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { env } from '../src/lib/env';

async function main() {
  console.log('📋 Listing your Telegram chats and channels...\n');

  if (!env.TELEGRAM_API_ID || !env.TELEGRAM_API_HASH) {
    console.error('❌ TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env');
    process.exit(1);
  }

  if (!env.TELEGRAM_SESSION_STRING) {
    console.error('❌ TELEGRAM_SESSION_STRING must be set in .env');
    console.error('   Run: npx tsx scripts/setup-telegram-auth.ts first\n');
    process.exit(1);
  }

  const apiId = parseInt(env.TELEGRAM_API_ID, 10);
  const apiHash = env.TELEGRAM_API_HASH;
  const sessionString = env.TELEGRAM_SESSION_STRING;

  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Telegram\n');

    if (!(await client.checkAuthorization())) {
      console.error('❌ Not authorized. Run: npx tsx scripts/setup-telegram-auth.ts');
      await client.disconnect();
      process.exit(1);
    }

    console.log('📱 Fetching your chats and channels...\n');

    // Get all dialogs (chats, channels, groups)
    const dialogs = await client.getDialogs();

    console.log(`Found ${dialogs.length} chats/channels:\n`);
    console.log('='.repeat(80));

    // Filter and display channels
    const channels = dialogs.filter(d => d.isChannel);
    const groups = dialogs.filter(d => d.isGroup);
    const chats = dialogs.filter(d => !d.isChannel && !d.isGroup);

    if (channels.length > 0) {
      console.log('\n📢 CHANNELS:\n');
      channels.forEach((dialog, index) => {
        const entity = dialog.entity;
        const title = dialog.title || 'Unknown';
        const username = (entity as any).username;
        const id = (entity as any).id;

        // For channels, the ID format is usually -100XXXXXXXXX
        const channelId = id ? `-100${Math.abs(id)}` : 'N/A';

        console.log(`${index + 1}. ${title}`);
        if (username) {
          console.log(`   Username: @${username}`);
          console.log(`   Use in .env: TELEGRAM_CHANNEL_ID=@${username}`);
        } else {
          console.log(`   Channel ID: ${channelId}`);
          console.log(`   Use in .env: TELEGRAM_CHANNEL_ID=${channelId}`);
        }
        console.log(`   Messages: ${dialog.unreadCount || 0} unread`);
        console.log('');
      });
    }

    if (groups.length > 0) {
      console.log('\n👥 GROUPS:\n');
      groups.forEach((dialog, index) => {
        const entity = dialog.entity;
        const title = dialog.title || 'Unknown';
        const username = (entity as any).username;
        const id = (entity as any).id;

        const groupId = id ? `-${Math.abs(id)}` : 'N/A';

        console.log(`${index + 1}. ${title}`);
        if (username) {
          console.log(`   Username: @${username}`);
        } else {
          console.log(`   Group ID: ${groupId}`);
        }
        console.log(`   Messages: ${dialog.unreadCount || 0} unread`);
        console.log('');
      });
    }

    if (chats.length > 0) {
      console.log('\n💬 PRIVATE CHATS:\n');
      chats.slice(0, 10).forEach((dialog, index) => {
        const title = dialog.title || 'Unknown';
        console.log(`${index + 1}. ${title}`);
        console.log(`   Messages: ${dialog.unreadCount || 0} unread`);
        console.log('');
      });
      if (chats.length > 10) {
        console.log(`   ... and ${chats.length - 10} more private chats\n`);
      }
    }

    console.log('='.repeat(80));
    console.log('\n💡 Tip: Look for "32-61/63" in the channels list above');
    console.log('   Copy the username (if available) or channel ID to your .env file\n');

    await client.disconnect();
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    if (error.errorMessage) {
      console.error('   Telegram error:', error.errorMessage);
    }
    await client.disconnect().catch(() => {});
    process.exit(1);
  }
}

main();

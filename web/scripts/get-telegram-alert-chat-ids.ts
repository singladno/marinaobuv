#!/usr/bin/env npx tsx
/**
 * Get Telegram chat IDs of users who have messaged your alert bot.
 * Use this to fill TELEGRAM_ALERT_CHAT_IDS so multiple people receive webhook alerts.
 *
 * How to use:
 * 1. Set TELEGRAM_BOT_TOKEN in web/.env (same bot used for alerts).
 * 2. Have each person open your bot in Telegram and tap "Start" (or send any message).
 * 3. Run: cd web && npx tsx scripts/get-telegram-alert-chat-ids.ts
 * 4. Copy the comma-separated list into .env: TELEGRAM_ALERT_CHAT_IDS=id1,id2,id3
 */

import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ Set TELEGRAM_BOT_TOKEN in web/.env');
  process.exit(1);
}

const url = `https://api.telegram.org/bot${token}/getUpdates`;

async function main() {
  const res = await fetch(url);
  if (!res.ok) {
    console.error('❌ Telegram API error:', res.status, await res.text());
    process.exit(1);
  }
  const data = await res.json();
  if (!data.ok) {
    console.error('❌ Telegram API:', data);
    process.exit(1);
  }

  const updates = data.result || [];
  const chatIds = new Set<number>();
  for (const u of updates) {
    const chat = u.message?.chat || u.edited_message?.chat;
    if (chat?.id) chatIds.add(chat.id);
  }

  if (chatIds.size === 0) {
    console.log('No chats found.');
    console.log('');
    console.log('Have each person who should get alerts:');
    console.log('  1. Open your bot in Telegram (link from @BotFather)');
    console.log('  2. Tap "Start" or send any message');
    console.log('  3. Run this script again');
    return;
  }

  const sorted = [...chatIds].sort((a, b) => a - b);
  const list = sorted.join(', ');
  console.log('Chat IDs that have messaged your bot:');
  console.log('');
  sorted.forEach(id => console.log('  ', id));
  console.log('');
  console.log('Use in .env (comma-separated):');
  console.log('');
  console.log('TELEGRAM_ALERT_CHAT_IDS=' + list);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

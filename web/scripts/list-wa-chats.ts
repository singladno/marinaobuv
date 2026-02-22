#!/usr/bin/env tsx
/**
 * List WhatsApp chats (and groups with names) via Green API.
 * Use this to find the chat ID for a group (e.g. "Анл 1-07-09").
 *
 * Usage: npx tsx scripts/list-wa-chats.ts
 * Requires: GREEN_API_INSTANCE_ID, GREEN_API_TOKEN, GREEN_API_BASE_URL (optional)
 */

import '../src/scripts/load-env';
import { env, getWaChatIds } from '../src/lib/env';
import { prisma } from '../src/lib/db-node';

const baseUrl =
  (env.GREEN_API_BASE_URL || 'https://api.green-api.com').replace(/\/$/, '');
const instanceId = env.GREEN_API_INSTANCE_ID;
const token = env.GREEN_API_TOKEN;

async function getLastIncomingMessages(minutes: number): Promise<any[]> {
  const url = `${baseUrl}/waInstance${instanceId}/lastIncomingMessages/${token}?minutes=${minutes}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`lastIncomingMessages failed: ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function getGroupData(
  groupId: string
): Promise<{ subject?: string; size?: number } | null> {
  const url = `${baseUrl}/waInstance${instanceId}/getGroupData/${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId }),
  });
  if (!res.ok) return null;
  let data: any;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  if (typeof data === 'string' || data.errorId || data.error) return null;
  return {
    subject: data.subject,
    size: data.size,
  };
}

/** Call GetGroupData and return raw response for debugging. */
async function getGroupDataRaw(groupId: string): Promise<{ status: number; body: unknown }> {
  const url = `${baseUrl}/waInstance${instanceId}/getGroupData/${token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId }),
  });
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = { _raw: await res.text() };
  }
  return { status: res.status, body };
}

async function main() {
  if (!instanceId || !token) {
    console.error('Set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN');
    process.exit(1);
  }

  console.log('Fetching recent incoming messages (last 7 days) to collect chat IDs...\n');
  const minutes = 7 * 24 * 60; // 7 days
  const messages = (await getLastIncomingMessages(minutes)) as any[];
  const chatIds = [...new Set(messages.map((m: any) => m.chatId).filter(Boolean))];
  console.log(`Found ${chatIds.length} unique chat(s).\n`);

  const configured = getWaChatIds();
  const messageCountByChatId = new Map<string, number>();

  try {
    if (configured.length > 0) {
      console.log('Configured (WA_CHAT_IDS / TARGET_GROUP_ID):', configured.join(', '));
    }
    const inDb = await prisma.whatsAppMessage.groupBy({
      by: ['chatId'],
      where: { chatId: { not: null } },
      _count: { chatId: true },
      orderBy: { _count: { chatId: 'desc' } },
    });
    inDb.forEach(({ chatId, _count }) => {
      if (chatId) messageCountByChatId.set(chatId, _count.chatId);
    });
    if (inDb.length > 0) {
      console.log('Chat IDs that already have messages in DB (top 10 by count):');
      inDb.slice(0, 10).forEach(({ chatId, _count }) =>
        console.log(`  ${chatId} (${_count.chatId} messages)`)
      );
      console.log('');
    }
  } catch {
    // DB not available or not configured
  }

  const debug = process.env.DEBUG === '1' || process.env.DEBUG === 'true';
  if (debug && messages.length > 0) {
    const first = messages[0];
    console.log('--- DEBUG: first message keys ---');
    console.log(Object.keys(first).sort().join(', '));
    const firstGroupMsg = messages.find((m: any) => m.chatId && String(m.chatId).endsWith('@g.us'));
    if (firstGroupMsg) {
      console.log('\n--- DEBUG: first GROUP message keys ---');
      console.log(Object.keys(firstGroupMsg).sort().join(', '));
      const raw = await getGroupDataRaw(firstGroupMsg.chatId);
      console.log('\n--- DEBUG: GetGroupData response (first group) ---');
      console.log('Status:', raw.status);
      console.log('Body:', JSON.stringify(raw.body, null, 2));
      console.log('');
    }
  }

  // Build chatId -> name from message payloads (LastIncomingMessages may include chatName)
  const nameByChatId = new Map<string, string>();
  for (const m of messages) {
    if (!m.chatId || nameByChatId.has(m.chatId)) continue;
    const name =
      m.chatName ?? m.chat?.name ?? m.conversationName ?? m.groupName ?? m.subject;
    if (name && String(name).trim()) {
      nameByChatId.set(m.chatId, String(name).trim());
    }
  }

  const groups = chatIds.filter((id: string) => String(id).endsWith('@g.us'));
  const privateChats = chatIds.filter((id: string) => !String(id).endsWith('@g.us'));

  // Sort: configured first, then by message count (desc), then the rest
  const configuredSet = new Set(configured);
  groups.sort((a, b) => {
    const aConfig = configuredSet.has(a) ? 1 : 0;
    const bConfig = configuredSet.has(b) ? 1 : 0;
    if (aConfig !== bConfig) return bConfig - aConfig;
    const aCount = messageCountByChatId.get(a) ?? 0;
    const bCount = messageCountByChatId.get(b) ?? 0;
    return bCount - aCount;
  });

  if (groups.length > 0) {
    console.log('--- Groups (configured / with messages first) ---');
    let getGroupDataSkipped = false;
    for (let i = 0; i < groups.length; i++) {
      const chatId = groups[i];
      const nameFromMessages = nameByChatId.get(chatId);
      let name = nameFromMessages ?? '(name unknown)';
      let size: string | number = '?';
      if (!getGroupDataSkipped) {
        const info = await getGroupData(chatId);
        if (info) {
          if (info.subject != null) name = info.subject;
          if (info.size != null) size = info.size;
        } else if (i === 0) {
          getGroupDataSkipped = true;
        }
      }
      const inDbCount = messageCountByChatId.get(chatId);
      const badge = configuredSet.has(chatId)
        ? ' [CONFIGURED]'
        : inDbCount != null
          ? ` [${inDbCount} in DB]`
          : '';
      console.log(`${chatId}${badge}`);
      console.log(`  Name: ${name}`);
      console.log(`  Participants: ${size}`);
      console.log('');
      await new Promise(r => setTimeout(r, 300));
    }
    if (getGroupDataSkipped && groups.length > 1) {
      console.log('(GetGroupData failed for first group – names from API skipped for rest. Run when instance is authorized to fetch names.)\n');
    }
  }

  if (privateChats.length > 0) {
    console.log('--- Private chats ---');
    privateChats.forEach((id: string) => console.log(id));
  }

  const currentGroup = configured[0] ?? (messageCountByChatId.size > 0 ? [...messageCountByChatId.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] : null);
  console.log('\n--- Summary ---');
  if (currentGroup) {
    console.log(`Your current group: ${currentGroup}`);
    console.log('To add a second group (e.g. Анл 1-07-09):');
    console.log('  1. Open Green API console → Chats → open the group → copy "Group id"');
    console.log(`  2. In .env set: WA_CHAT_IDS=${currentGroup},PASTE_SECOND_GROUP_ID_HERE`);
  } else {
    console.log('Add the desired group chatId to WA_CHAT_IDS (comma-separated) in .env');
  }
  if (!debug && (nameByChatId.size === 0 || groups.every(id => !nameByChatId.get(id)))) {
    console.log('\nTip: Names unknown? Run with DEBUG=1 to see API response:');
    console.log('  DEBUG=1 npm run list:wa-chats');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });

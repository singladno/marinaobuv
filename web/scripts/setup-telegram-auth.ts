#!/usr/bin/env tsx

/**
 * Setup script for Telegram user account authentication
 * This script helps you authenticate your Telegram account for MTProto access
 *
 * Usage:
 * 1. Get API credentials from https://my.telegram.org/apps
 * 2. Set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_PHONE in .env
 * 3. Run this script: npx tsx scripts/setup-telegram-auth.ts
 * 4. Enter the code you receive via Telegram
 * 5. Save the session string to TELEGRAM_SESSION_STRING in .env
 */

import '../src/scripts/load-env';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { env } from '../src/lib/env';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔐 Telegram User Account Authentication Setup\n');

  if (!env.TELEGRAM_API_ID || !env.TELEGRAM_API_HASH) {
    console.error('❌ TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env');
    console.error('   Get them from: https://my.telegram.org/apps\n');
    process.exit(1);
  }

  if (!env.TELEGRAM_PHONE) {
    console.error('❌ TELEGRAM_PHONE must be set in .env (e.g., +1234567890)\n');
    process.exit(1);
  }

  const apiId = parseInt(env.TELEGRAM_API_ID, 10);
  const apiHash = env.TELEGRAM_API_HASH;
  const phone = env.TELEGRAM_PHONE;
  const sessionString = env.TELEGRAM_SESSION_STRING || '';

  console.log(`📱 Phone: ${phone}`);
  console.log(`🔑 API ID: ${apiId}\n`);

  const stringSession = new StringSession(sessionString);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Telegram\n');

    // Check if already authorized
    if (await client.checkAuthorization()) {
      console.log('✅ Already authorized!');
      const currentSession = client.session.save() as unknown as string;
      if (currentSession !== sessionString) {
        console.log('\n📝 Updated session string (update TELEGRAM_SESSION_STRING in .env):');
        console.log(currentSession);
      } else {
        console.log('\n✅ Session is up to date');
      }
      await client.disconnect();
      rl.close();
      return;
    }

    // Not authorized, need to authenticate
    // Use start() method which handles the entire auth flow including 2FA
    console.log('📨 Starting authentication...');
    console.log('   You will receive a code via Telegram.\n');

    try {
      await client.start({
        phoneNumber: phone,
        password: async () => {
          // This will be called if 2FA is enabled
          console.log('\n🔒 Two-factor authentication is enabled.');
          const password = await question('Enter your 2FA password: ');
          console.log('⏳ Verifying password...');
          return password;
        },
        phoneCode: async () => {
          const code = await question('Enter the code you received via Telegram: ');
          console.log('⏳ Verifying code...');
          return code.trim();
        },
        onError: (err) => {
          console.error('\n❌ Authentication error:', err);
          throw err;
        },
      });

      console.log('\n✅ Authentication successful!\n');

      const newSessionString = client.session.save() as unknown as string;
      console.log('📝 Save this session string to TELEGRAM_SESSION_STRING in your .env file:');
      console.log('\n' + '='.repeat(80));
      console.log(newSessionString);
      console.log('='.repeat(80) + '\n');

      // Verify authorization
      if (await client.checkAuthorization()) {
        console.log('✅ Account is fully authenticated and ready to use!');
      }
    } catch (error: any) {
      console.error('\n❌ Authentication failed:', error.message || error);
      if (error.errorMessage) {
        console.error('   Error details:', error.errorMessage);
      }
      throw error;
    }

    await client.disconnect();
  } catch (error: any) {
    console.error('\n❌ Authentication failed!');
    if (error instanceof Error) {
      console.error('   Error:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
      }
    } else if (error.errorMessage) {
      console.error('   Telegram error:', error.errorMessage);
      console.error('   Error code:', error.code);
    } else {
      console.error('   Full error:', error);
    }

    await client.disconnect().catch(() => {});
    rl.close();
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

#!/usr/bin/env tsx

import 'dotenv/config';
import { testGroqConnection } from './src/lib/groq-proxy-config';

async function main() {
  console.log('🧪 Testing Groq connection through proxy...');

  const success = await testGroqConnection();

  if (success) {
    console.log('✅ Groq proxy configuration is working!');
    process.exit(0);
  } else {
    console.log('❌ Groq proxy configuration failed!');
    process.exit(1);
  }
}

main().catch(console.error);

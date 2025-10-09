#!/usr/bin/env tsx

import { prisma } from '../lib/db-node';

/**
 * Fix empty text messages by extracting text from rawPayload
 */
async function fixEmptyTextMessages() {
  console.log('🔍 Finding messages with empty text but type "textMessage"...');
  
  const emptyTextMessages = await prisma.whatsAppMessage.findMany({
    where: {
      type: 'textMessage',
      text: null,
      processed: false,
    },
    select: {
      id: true,
      text: true,
      rawPayload: true,
      createdAt: true,
    },
  });

  console.log(`📊 Found ${emptyTextMessages.length} messages with empty text`);

  if (emptyTextMessages.length === 0) {
    console.log('✅ No empty text messages found');
    return;
  }

  let fixed = 0;
  let skipped = 0;

  for (const message of emptyTextMessages) {
    try {
      const rawPayload = message.rawPayload as any;
      let extractedText: string | null = null;

      // Try different possible text fields in rawPayload
      if (rawPayload?.textMessage) {
        extractedText = rawPayload.textMessage;
      } else if (rawPayload?.text) {
        extractedText = rawPayload.text;
      } else if (rawPayload?.message?.text) {
        extractedText = rawPayload.message.text;
      } else if (rawPayload?.extendedTextMessage?.text) {
        extractedText = rawPayload.extendedTextMessage.text;
      }

      if (extractedText && extractedText.trim().length > 0) {
        await prisma.whatsAppMessage.update({
          where: { id: message.id },
          data: { text: extractedText.trim() },
        });
        
        console.log(`✅ Fixed message ${message.id}: "${extractedText.substring(0, 50)}..."`);
        fixed++;
      } else {
        console.log(`⚠️  No text found in rawPayload for message ${message.id}`);
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error fixing message ${message.id}:`, error);
      skipped++;
    }
  }

  console.log(`\n📊 Fix Summary:`);
  console.log(`✅ Fixed: ${fixed} messages`);
  console.log(`⚠️  Skipped: ${skipped} messages`);
  console.log(`📈 Total processed: ${fixed + skipped} messages`);
}

async function main() {
  try {
    await fixEmptyTextMessages();
    console.log('\n🎉 Text message fix completed!');
  } catch (error) {
    console.error('❌ Error during fix:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

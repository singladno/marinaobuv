#!/usr/bin/env tsx

import { prisma } from '../lib/db-node';

/**
 * Fix extendedTextMessage records that have empty text field
 * Extract text from rawPayload.messageData.extendedTextMessageData.text
 */
async function fixExtendedTextMessages() {
  console.log('🔍 Finding extendedTextMessage records with empty text...');

  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      type: 'extendedTextMessage',
      OR: [{ text: null }, { text: '' }, { text: 'null' }],
    },
    select: {
      id: true,
      text: true,
      rawPayload: true,
    },
  });

  console.log(
    `📊 Found ${messages.length} extendedTextMessage records to check`
  );

  let fixed = 0;
  let skipped = 0;

  for (const message of messages) {
    try {
      const rawPayload = message.rawPayload as any;
      let extractedText: string | null = null;

      // Try different possible text fields in rawPayload for extendedTextMessage
      if (rawPayload?.messageData?.extendedTextMessageData?.text) {
        extractedText = rawPayload.messageData.extendedTextMessageData.text;
      } else if (rawPayload?.messageData?.extendedTextMessage?.text) {
        extractedText = rawPayload.messageData.extendedTextMessage.text;
      } else if (rawPayload?.extendedTextMessageData?.text) {
        extractedText = rawPayload.extendedTextMessageData.text;
      } else if (rawPayload?.extendedTextMessage?.text) {
        extractedText = rawPayload.extendedTextMessage.text;
      }

      if (extractedText && extractedText.trim().length > 0) {
        await prisma.whatsAppMessage.update({
          where: { id: message.id },
          data: { text: extractedText.trim() },
        });

        console.log(
          `✅ Fixed message ${message.id}: "${extractedText.substring(0, 50)}..."`
        );
        fixed++;
      } else {
        console.log(
          `⚠️  No text found in rawPayload for message ${message.id}`
        );
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
    await fixExtendedTextMessages();
    console.log('🎉 Extended text message fix completed!');
  } catch (error) {
    console.error('❌ Error during fix:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

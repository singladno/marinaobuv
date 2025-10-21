import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

interface WhatsAppMessageRow {
  id: string;
  waMessageId: string;
  from: string;
  type: string;
  source: string;
  chatId: string;
  fromMe: string;
  fromName: string;
  timestamp: string;
  mediaId: string;
  mediaWidth: string;
  mediaHeight: string;
  mediaSha256: string;
  mediaPreview: string;
  mediaFileSize: string;
  mediaMimeType: string;
  text: string;
  mediaS3Key: string;
  mediaUrl: string;
  providerId: string;
  processed: string;
  rawPayload: string;
  createdAt: string;
  updatedAt: string;
  draftProductId: string;
  aiGroupId: string;
}

async function importWhatsAppMessages() {
  console.log('🚀 Starting WhatsApp Messages import from CSV...');

  try {
    // Path to the CSV file
    const csvPath = '/Users/dali/Desktop/_WhatsAppMessage__202510110107.csv';

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    console.log(`📁 Reading CSV file: ${csvPath}`);

    // Read and parse CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records: WhatsAppMessageRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📊 Found ${records.length} records in CSV`);

    // Clear existing WhatsApp messages (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing WhatsApp messages...');
    const deleteResult = await prisma.whatsAppMessage.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.count} existing records`);

    // Process records in batches
    const batchSize = 1000;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(records.length / batchSize);

      console.log(
        `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`
      );

      try {
        const dataToInsert = batch.map(record => ({
          id: record.id,
          waMessageId: record.waMessageId || `imported-${record.id}`, // Ensure non-null
          from: record.from || null,
          type: record.type || null,
          source: record.source || null,
          chatId: record.chatId || null,
          fromMe: record.fromMe === 'true',
          fromName: record.fromName || null,
          timestamp: record.timestamp ? parseInt(record.timestamp) : null,
          mediaId: record.mediaId || null,
          mediaWidth: record.mediaWidth ? parseInt(record.mediaWidth) : null,
          mediaHeight: record.mediaHeight ? parseInt(record.mediaHeight) : null,
          mediaSha256: record.mediaSha256 || null,
          mediaPreview: record.mediaPreview || null,
          mediaFileSize: record.mediaFileSize
            ? parseInt(record.mediaFileSize)
            : null,
          mediaMimeType: record.mediaMimeType || null,
          text: record.text || null,
          mediaS3Key: record.mediaS3Key || null,
          mediaUrl: record.mediaUrl || null,
          providerId: record.providerId || null,
          processed: record.processed === 'true',
          rawPayload: record.rawPayload ? JSON.parse(record.rawPayload) : {},
          createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
          updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
          draftProductId: record.draftProductId || null,
          aiGroupId: record.aiGroupId || null,
        }));

        await prisma.whatsAppMessage.createMany({
          data: dataToInsert,
          skipDuplicates: true,
        });

        imported += batch.length;
        console.log(
          `✅ Batch ${batchNumber} imported successfully (${imported}/${records.length} total)`
        );
      } catch (error) {
        console.error(`❌ Error importing batch ${batchNumber}:`, error);
        errors++;

        // Continue with next batch
        continue;
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`📊 Total records processed: ${records.length}`);
    console.log(`✅ Successfully imported: ${imported}`);
    console.log(`❌ Errors: ${errors}`);

    // Verify the import
    const count = await prisma.whatsAppMessage.count();
    console.log(`📊 Total records in database: ${count}`);
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importWhatsAppMessages()
    .then(() => {
      console.log('✅ Import finished successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importWhatsAppMessages };

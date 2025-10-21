import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface WhatsAppMessageCSV {
  id: string;
  waMessageId: string;
  from: string;
  type: string;
  source: string;
  chatId: string;
  fromMe: boolean;
  fromName: string;
  timestamp: number;
  mediaId: string;
  mediaWidth: number;
  mediaHeight: number;
  mediaSha256: string;
  mediaPreview: string;
  mediaFileSize: number;
  mediaMimeType: string;
  text: string;
  mediaS3Key: string;
  mediaUrl: string;
  providerId: string;
  processed: boolean;
  rawPayload: string;
  createdAt: string;
  updatedAt: string;
  draftProductId: string;
  aiGroupId: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseCSV(csvContent: string): WhatsAppMessageCSV[] {
  const lines = csvContent.split('\n');
  const headers = parseCSVLine(lines[0]);

  const messages: WhatsAppMessageCSV[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length !== headers.length) continue;

    const message: any = {};
    headers.forEach((header, index) => {
      let value = values[index];

      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      // Parse specific fields
      switch (header) {
        case 'fromMe':
          message[header] = value === 'true';
          break;
        case 'timestamp':
          message[header] = parseInt(value) || 0;
          break;
        case 'mediaWidth':
        case 'mediaHeight':
        case 'mediaFileSize':
          message[header] = value ? parseInt(value) : null;
          break;
        case 'processed':
          message[header] = value === 'true';
          break;
        case 'createdAt':
        case 'updatedAt':
          message[header] = value ? new Date(value) : new Date();
          break;
        default:
          message[header] = value || null;
      }
    });

    messages.push(message as WhatsAppMessageCSV);
  }

  return messages;
}

async function clearAndImportMessages() {
  try {
    console.log('Starting WhatsApp messages import process...');

    // Step 1: Clear the WhatsApp messages table
    console.log('Clearing existing WhatsApp messages...');
    const deleteResult = await prisma.whatsAppMessage.deleteMany({});
    console.log(`Deleted ${deleteResult.count} existing messages`);

    // Step 2: Read and parse the new CSV file
    const csvPath = '/Users/dali/Desktop/_WhatsAppMessage__202510182138.csv';
    console.log(`Reading CSV file: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    console.log('Parsing CSV file...');
    const messages = parseCSV(csvContent);
    console.log(`Found ${messages.length} messages to import`);

    if (messages.length === 0) {
      console.log('No messages found in CSV file');
      return;
    }

    // Step 3: Import messages in batches
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    console.log(`Starting import in batches of ${batchSize}...`);

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      try {
        // Use createMany for better performance
        const result = await prisma.whatsAppMessage.createMany({
          data: batch.map(message => ({
            id: message.id,
            waMessageId: message.waMessageId,
            from: message.from,
            type: message.type,
            source: message.source,
            chatId: message.chatId,
            fromMe: message.fromMe,
            fromName: message.fromName,
            timestamp: message.timestamp,
            mediaId: message.mediaId,
            mediaWidth: message.mediaWidth,
            mediaHeight: message.mediaHeight,
            mediaSha256: message.mediaSha256,
            mediaPreview: message.mediaPreview,
            mediaFileSize: message.mediaFileSize,
            mediaMimeType: message.mediaMimeType,
            text: message.text,
            mediaS3Key: message.mediaS3Key,
            mediaUrl: message.mediaUrl,
            providerId: message.providerId,
            processed: message.processed,
            rawPayload: message.rawPayload
              ? (() => {
                  try {
                    return JSON.parse(message.rawPayload);
                  } catch (e) {
                    console.warn(
                      `Invalid JSON in rawPayload for message ${message.id}, storing as string`
                    );
                    return message.rawPayload;
                  }
                })()
              : null,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            draftProductId: message.draftProductId,
            aiGroupId: message.aiGroupId,
          })),
          skipDuplicates: true, // Skip duplicates if any
        });

        imported += result.count;

        if (imported % 1000 === 0) {
          console.log(`Imported ${imported} messages...`);
        }
      } catch (batchError) {
        console.error(
          `Error importing batch ${i}-${i + batchSize}:`,
          batchError
        );
        errors++;

        // Try individual inserts for this batch
        for (const message of batch) {
          try {
            await prisma.whatsAppMessage.create({
              data: {
                id: message.id,
                waMessageId: message.waMessageId,
                from: message.from,
                type: message.type,
                source: message.source,
                chatId: message.chatId,
                fromMe: message.fromMe,
                fromName: message.fromName,
                timestamp: message.timestamp,
                mediaId: message.mediaId,
                mediaWidth: message.mediaWidth,
                mediaHeight: message.mediaHeight,
                mediaSha256: message.mediaSha256,
                mediaPreview: message.mediaPreview,
                mediaFileSize: message.mediaFileSize,
                mediaMimeType: message.mediaMimeType,
                text: message.text,
                mediaS3Key: message.mediaS3Key,
                mediaUrl: message.mediaUrl,
                providerId: message.providerId,
                processed: message.processed,
                rawPayload: message.rawPayload
                  ? (() => {
                      try {
                        return JSON.parse(message.rawPayload);
                      } catch (e) {
                        console.warn(
                          `Invalid JSON in rawPayload for message ${message.id}, storing as string`
                        );
                        return message.rawPayload;
                      }
                    })()
                  : null,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
                draftProductId: message.draftProductId,
                aiGroupId: message.aiGroupId,
              },
            });
            imported++;
          } catch (individualError) {
            console.error(
              `Error importing individual message ${message.id}:`,
              individualError
            );
            errors++;
          }
        }
      }
    }

    // Step 4: Verify the import
    const totalCount = await prisma.whatsAppMessage.count();
    console.log('\n=== Import Summary ===');
    console.log(`Total messages in database: ${totalCount}`);
    console.log(`Messages imported: ${imported}`);
    console.log(`Errors encountered: ${errors}`);
    console.log(`Expected from CSV: ${messages.length}`);

    if (totalCount === messages.length) {
      console.log('✅ Import completed successfully!');
    } else {
      console.log('⚠️  Import completed with discrepancies');
    }
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
clearAndImportMessages();

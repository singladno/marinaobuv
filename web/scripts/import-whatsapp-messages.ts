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

async function importMessages() {
  try {
    console.log('Starting WhatsApp messages import...');

    // Read the CSV file
    const csvPath = '/Users/dali/Desktop/_WhatsAppMessage__202510110107.csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    console.log('Parsing CSV file...');
    const messages = parseCSV(csvContent);
    console.log(`Found ${messages.length} messages to import`);

    // Process messages in batches
    const batchSize = 100;
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      for (const message of batch) {
        try {
          // Check if message already exists
          const existing = await prisma.whatsAppMessage.findUnique({
            where: { id: message.id },
          });

          if (existing) {
            skipped++;
            continue;
          }

          // Create the message
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
              rawPayload: message.rawPayload,
              createdAt: message.createdAt,
              updatedAt: message.updatedAt,
              draftProductId: message.draftProductId,
              aiGroupId: message.aiGroupId,
            },
          });

          imported++;

          if (imported % 100 === 0) {
            console.log(`Imported ${imported} messages...`);
          }
        } catch (error) {
          console.error(`Error importing message ${message.id}:`, error);
          skipped++;
        }
      }
    }

    console.log(`Import completed!`);
    console.log(`- Imported: ${imported} messages`);
    console.log(`- Skipped: ${skipped} messages`);
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importMessages();

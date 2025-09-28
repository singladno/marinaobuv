// import { createHash } from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { env } from '@/lib/env';
import { buildKey, putBuffer, publicUrl, computeSha256 } from '@/lib/s3u';
import { prisma } from '@/lib/server/db';
import {
  isGroupJid,
  extractMessageText,
  mediaInfo,
  fetchMediaBuffer,
} from '@/lib/whapi';
import { normalizeTextToDraft } from '@/lib/yagpt';
import { WebhookPayloadSchema, isMessagesUpsert } from '@/types/whapi';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;
    // Verify webhook secret
    if (secret !== env.WHAPI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate payload structure
    const parseResult = WebhookPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('Invalid webhook payload:', parseResult.error);
      return NextResponse.json(
        { ok: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const payload = parseResult.data;

    // Handle verification/ping (if Whapi supports it)
    if (body.event === 'ping' || body.event === 'PING') {
      const verifyToken = body.verify_token || body.verifyToken;
      if (env.WHAPI_VERIFY_TOKEN && verifyToken === env.WHAPI_VERIFY_TOKEN) {
        return NextResponse.json({ ok: true, message: 'Verified' });
      }
    }

    // Only process messages.upsert events
    if (!isMessagesUpsert(payload)) {
      return NextResponse.json({ ok: true, message: 'Event not processed' });
    }

    const { key, message, pushName } = payload.data;

    // Ignore messages from self
    if (key.fromMe) {
      return NextResponse.json({ ok: true, message: 'Ignored self message' });
    }

    // Only process group messages
    if (!isGroupJid(key.remoteJid)) {
      return NextResponse.json({ ok: true, message: 'Not a group message' });
    }

    // Skip group_invite messages
    const messageType = message ? Object.keys(message)[0] : null;
    if (messageType === 'group_invite') {
      return NextResponse.json({
        ok: true,
        message: 'Skipped group_invite message',
      });
    }

    // Extract text content
    const text = message ? extractMessageText(message) : null;

    // Upsert WhatsAppMessage
    const waMessage = await prisma.whatsAppMessage.upsert({
      where: { waMessageId: key.id },
      update: {
        remoteJid: key.remoteJid,
        fromMe: key.fromMe,
        pushName: pushName || null,
        messageType,
        text: text || null,
        rawPayload: body,
        updatedAt: new Date(),
      },
      create: {
        waMessageId: key.id,
        remoteJid: key.remoteJid,
        fromMe: key.fromMe,
        pushName: pushName || null,
        messageType,
        text: text || null,
        rawPayload: body,
      },
    });

    // Process media if present
    let mediaS3Key: string | null = null;
    let mediaUrl: string | null = null;
    let mediaMime: string | null = null;
    let mediaSha256: string | null = null;

    if (message) {
      const mediaData = mediaInfo(message);
      if (mediaData && (mediaData.url || mediaData.id)) {
        try {
          // Check if S3 credentials are available
          if (env.S3_ACCESS_KEY && env.S3_SECRET_KEY) {
            const { buf, mime, ext } = await fetchMediaBuffer({
              url: mediaData.url,
              id: mediaData.id,
              token: env.WHAPI_TOKEN,
            });

            const key = buildKey(ext);
            const uploadResult = await putBuffer(key, buf, mime);

            if (uploadResult.success) {
              mediaS3Key = key;
              mediaUrl = uploadResult.url || publicUrl(key);
              mediaMime = mime;
              mediaSha256 = computeSha256(buf);

              // Update message with media info
              await prisma.whatsAppMessage.update({
                where: { id: waMessage.id },
                data: {
                  mediaS3Key,
                  mediaUrl,
                  mediaMime,
                  mediaSha256,
                },
              });
            }
          } else {
            console.log('S3 credentials not configured, skipping media upload');
          }
        } catch (error) {
          console.error('Failed to process media:', error);
        }
      }
    }

    // Process text with YandexGPT if present
    if (text) {
      try {
        // Check if Yandex Cloud credentials are available
        if (env.YC_FOLDER_ID && (env.YC_IAM_TOKEN || env.YC_API_KEY)) {
          const draft = await normalizeTextToDraft(text);
          if (draft) {
            await prisma.productDraft.upsert({
              where: { messageId: waMessage.id },
              update: {
                name: draft.name,
                season: (draft.season?.toUpperCase() as any) || null,
                typeSlug: draft.typeSlug || null,
                pricePair: draft.pricePair || null,
                packPairs: draft.packPairs || null,
                priceBox: draft.priceBox || null,
                material: draft.material || null,
                gender: (draft.gender?.toUpperCase() as any) || null,
                sizes: draft.sizes || null,
                rawGptResponse: draft,
                updatedAt: new Date(),
              },
              create: {
                messageId: waMessage.id,
                name: draft.name,
                season: (draft.season?.toUpperCase() as any) || null,
                typeSlug: draft.typeSlug || null,
                pricePair: draft.pricePair || null,
                packPairs: draft.packPairs || null,
                priceBox: draft.priceBox || null,
                material: draft.material || null,
                gender: (draft.gender?.toUpperCase() as any) || null,
                sizes: draft.sizes || null,
                rawGptResponse: draft,
              },
            });
          }
        } else {
          console.log(
            'Yandex Cloud credentials not configured, skipping AI processing'
          );
        }
      } catch (error) {
        console.error('Failed to process text with YandexGPT:', error);
      }
    }

    // Log successful processing
    console.log(`Processed message ${key.id} from group ${key.remoteJid}:`, {
      hasText: !!text,
      hasMedia: !!mediaS3Key,
      sender: pushName,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to avoid webhook retries
    return NextResponse.json({ ok: false, error: 'Processing failed' });
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

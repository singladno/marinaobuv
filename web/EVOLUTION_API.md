# Evolution API Integration

This document describes the Evolution API webhook integration for processing WhatsApp GROUP messages and converting them to product drafts using YandexGPT.

## Overview

The integration consists of:
1. **Evolution API** - WhatsApp Web gateway
2. **YandexGPT** - AI text normalization
3. **Yandex Object Storage (S3)** - Media storage
4. **PostgreSQL** - Data persistence

## Architecture

```
WhatsApp Group → Evolution API → Webhook → YandexGPT → S3 → PostgreSQL
```

## Environment Variables

Create `.env.local` with the following variables:

```env
# Evolution API
EVOLUTION_BASE_URL="https://<your-evolution-host>"
EVOLUTION_API_KEY="<evolution-apikey>"
EVOLUTION_INSTANCE="<instance-name>"
EVOLUTION_WEBHOOK_SECRET="<random-long-string>"

# S3 Configuration (Yandex Object Storage)
S3_ENDPOINT="https://storage.yandexcloud.net"
S3_REGION="ru-central1"
S3_BUCKET="marinaobuv-media"
S3_ACCESS_KEY="<your-s3-access-key>"
S3_SECRET_KEY="<your-s3-secret-key>"
CDN_BASE_URL="https://cdn.marinaobuv.ru"

# Yandex Cloud
YC_FOLDER_ID="<yc-folder-id>"
YC_IAM_TOKEN="<iam-token>"
# Alternative: YC_API_KEY="<api-key>"
```

## Database Schema

### WhatsAppMessage
- `id` - Primary key
- `waMessageId` - Unique WhatsApp message ID
- `remoteJid` - Group JID (ends with @g.us)
- `fromMe` - Boolean flag
- `pushName` - Sender name
- `messageType` - Message type
- `text` - Extracted text content
- `mediaS3Key` - S3 key for media
- `mediaUrl` - Public URL for media
- `rawPayload` - Full webhook payload
- `createdAt` / `updatedAt` - Timestamps

### ProductDraft
- `id` - Primary key
- `messageId` - Foreign key to WhatsAppMessage
- `name` - Product name (required)
- `article` - Product article
- `season` - Season enum (SPRING/SUMMER/AUTUMN/WINTER)
- `typeSlug` - Product type slug
- `pricePair` - Price per pair in kopecks
- `packPairs` - Pairs per pack
- `priceBox` - Price per box in kopecks
- `material` - Material description
- `gender` - Gender enum (FEMALE/MALE/UNISEX)
- `sizes` - JSON array of {size, count}
- `rawGptResponse` - Full YandexGPT response
- `createdAt` / `updatedAt` - Timestamps

## API Endpoints

### Webhook Handler
```
POST /api/webhooks/evolution/{secret}/{event}
```
- `{secret}` - Webhook secret from environment
- `{event}` - Event type (messages-upsert, messages-update, messages-delete)

### Webhook Setup
```
GET /api/webhooks/evolution/setup
```
Registers webhook with Evolution API instance.

### Test Endpoint
```
GET /api/webhooks/evolution/test
```
Tests all pipeline components (development only).

## Setup Instructions

1. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

2. **Run Database Migration**
   ```bash
   npx prisma migrate dev
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Register Webhook**
   ```bash
   curl http://localhost:3000/api/webhooks/evolution/setup
   ```

5. **Test Pipeline**
   ```bash
   curl http://localhost:3000/api/webhooks/evolution/test
   ```

## Message Processing Flow

1. **Webhook Receives Message**
   - Validates webhook secret
   - Applies rate limiting
   - Parses Evolution API payload

2. **Message Filtering**
   - Skips messages from self (`fromMe: true`)
   - Only processes group messages (`@g.us` JID)
   - Only processes `MESSAGES_UPSERT` events

3. **Text Extraction**
   - `message.conversation` (text messages)
   - `message.extendedTextMessage.text` (extended text)
   - `message.imageMessage.caption` (image captions)
   - `message.videoMessage.caption` (video captions)

4. **Media Processing**
   - Detects media type (image/video/document)
   - Uploads base64 data or fetches from URL
   - Stores in S3 with generated key
   - Saves public URL

5. **AI Processing**
   - Sends text to YandexGPT for normalization
   - Extracts product information
   - Maps to database schema
   - Saves as ProductDraft

6. **Database Storage**
   - Upserts WhatsAppMessage
   - Upserts ProductDraft (if text available)

## YandexGPT Prompt

The AI is instructed to extract:
- Product name (required)
- Article number
- Season (spring/summer/autumn/winter)
- Product type
- Price per pair (in kopecks)
- Pack information
- Material
- Gender (female/male/unisex)
- Size availability

## Security Features

- **Webhook Secret** - Unguessable path segment
- **Rate Limiting** - Token bucket algorithm
- **Input Validation** - Zod schema validation
- **Error Handling** - Graceful failure handling
- **Logging** - Comprehensive error logging

## Monitoring

Check logs for:
- Webhook registration success
- Message processing status
- Media upload results
- YandexGPT processing results
- Database operation success

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Messages**
   - Check Evolution API instance status
   - Verify webhook URL is accessible
   - Check webhook secret configuration

2. **Media Upload Fails**
   - Verify S3 credentials
   - Check S3 bucket permissions
   - Verify CDN configuration

3. **YandexGPT Processing Fails**
   - Check Yandex Cloud credentials
   - Verify folder ID configuration
   - Check API quotas

4. **Database Errors**
   - Run Prisma migration
   - Check database connection
   - Verify schema consistency

### Debug Endpoints

- `/api/webhooks/evolution/test` - Test all components
- `/api/webhooks/evolution/setup` - Re-register webhook
- Check browser console for detailed logs

## Production Considerations

- Set up proper monitoring and alerting
- Configure log aggregation
- Set up database backups
- Monitor API quotas and limits
- Implement proper error reporting
- Consider webhook signature verification if available

## Rate Limits

- Webhook: 10 requests per minute per IP
- YandexGPT: Check Yandex Cloud quotas
- S3: Check Yandex Object Storage limits

## Dependencies

- `@aws-sdk/client-s3` - S3 client
- `@aws-sdk/lib-storage` - S3 upload
- `zod` - Schema validation
- `@prisma/client` - Database client

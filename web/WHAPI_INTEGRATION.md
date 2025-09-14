# Whapi.cloud Integration

This document describes the Whapi.cloud integration for capturing WhatsApp group messages and processing them with YandexGPT and Yandex S3.

## Overview

The integration replaces the previous Evolution API with Whapi.cloud to:
- Capture WhatsApp group messages via webhooks
- Normalize text content using YandexGPT
- Store media files in Yandex Object Storage (S3-compatible)
- Persist data using Prisma ORM

## Architecture

```
WhatsApp Group → Whapi.cloud → Webhook → Next.js API → YandexGPT → Yandex S3 → Database
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Whapi.cloud API
WHAPI_BASE_URL="https://panel.whapi.cloud/api"
WHAPI_TOKEN="<whapi-api-token>"
WHAPI_WEBHOOK_SECRET="<unguessable-string>"
WHAPI_VERIFY_TOKEN="<optional-verify-string>"

# Yandex Object Storage (S3-compatible)
S3_ENDPOINT="https://storage.yandexcloud.net"
S3_REGION="ru-central1"
S3_BUCKET="marinaobuv-media"
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
CDN_BASE_URL="https://cdn.marinaobuv.ru"

# Yandex Cloud
YC_FOLDER_ID=""
YC_IAM_TOKEN=""         # or YC_API_KEY=""
YC_API_KEY=""           # alternative to YC_IAM_TOKEN
```

## API Endpoints

### Webhook Endpoint
- **URL**: `/api/webhooks/whapi/[secret]`
- **Method**: POST
- **Purpose**: Receives WhatsApp messages from Whapi.cloud

### Setup Endpoint
- **URL**: `/api/webhooks/whapi/setup`
- **Method**: GET
- **Purpose**: Configures webhook URL with Whapi.cloud

## Database Models

### WhatsAppMessage
Stores raw WhatsApp messages with metadata:
- `waMessageId`: Unique WhatsApp message ID
- `remoteJid`: Group or chat identifier
- `fromMe`: Whether message is from self
- `pushName`: Sender display name
- `text`: Extracted text content
- `mediaS3Key`: S3 key for media files
- `mediaUrl`: Public URL for media
- `mediaMime`: MIME type of media
- `mediaSha256`: SHA256 hash of media
- `rawPayload`: Complete webhook payload

### ProductDraft
Stores AI-processed product information:
- `messageId`: Foreign key to WhatsAppMessage
- `name`: Product name
- `article`: Product article/sku
- `season`: Product season
- `typeSlug`: Product type slug
- `pricePair`: Price per pair (in kopecks)
- `packPairs`: Pairs per pack
- `priceBox`: Price per box
- `material`: Material description
- `gender`: Target gender
- `sizes`: Array of size and quantity objects
- `rawGptResponse`: Complete YandexGPT response

## Message Processing Flow

1. **Webhook Receives Message**: Whapi.cloud sends POST to webhook endpoint
2. **Security Check**: Verify webhook secret
3. **Group Filter**: Only process messages from groups (`@g.us`)
4. **Self Filter**: Ignore messages from self
5. **Text Extraction**: Extract text from various message types
6. **Media Processing**: Download and upload media to S3
7. **AI Processing**: Send text to YandexGPT for normalization
8. **Database Storage**: Store message and draft data

## Supported Message Types

- **Text Messages**: `conversation`, `extendedTextMessage`
- **Media Messages**: `imageMessage`, `videoMessage`, `documentMessage`
- **Media with Captions**: Extracts caption text for processing

## YandexGPT Integration

The system uses YandexGPT to extract structured product data from natural language:

### Input
Raw text from WhatsApp messages (e.g., "Красные туфли на каблуке, размер 38, цена 5000 рублей")

### Output
Structured JSON with fields:
- `name`: Product name
- `article`: SKU/article number
- `season`: spring/summer/autumn/winter
- `typeSlug`: Product type identifier
- `pricePair`: Price per pair in kopecks
- `packPairs`: Number of pairs per pack
- `priceBox`: Price per box
- `material`: Material description
- `gender`: female/male/unisex
- `sizes`: Array of {size, count} objects
- `notes`: Additional notes

## Media Storage

Media files are stored in Yandex Object Storage with:
- **Path**: `whatsapp/{timestamp}-{random}.{ext}`
- **Public URLs**: Served via CDN
- **Metadata**: MIME type, SHA256 hash
- **Supported Formats**: Images (JPEG, PNG, WebP), Videos (MP4, MOV), Documents (PDF, DOC)

## Testing

Run the test script to verify the integration:

```bash
node test-whapi.js
```

This will:
1. Test webhook setup endpoint
2. Send sample text message
3. Send sample media message

## Setup Instructions

1. **Configure Environment**: Set up all required environment variables
2. **Start Development Server**: `npm run dev`
3. **Register Webhook**: Call `/api/webhooks/whapi/setup` or configure manually in Whapi panel
4. **Connect WhatsApp**: Scan QR code in Whapi panel
5. **Test Integration**: Send messages to your WhatsApp group

## Error Handling

- **Webhook Failures**: Returns 200 to prevent retry storms
- **Media Processing**: Continues without media if download fails
- **AI Processing**: Continues without draft if YandexGPT fails
- **Database Errors**: Logged but don't stop processing

## Security

- **Webhook Secret**: Required for all webhook requests
- **HMAC Verification**: Optional signature verification (if supported by Whapi)
- **Rate Limiting**: Built-in Next.js rate limiting
- **Input Validation**: Zod schemas for all webhook payloads

## Monitoring

The system logs:
- Successful message processing
- Media upload status
- AI processing results
- Error conditions

Check your application logs for processing status and any issues.

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Messages**
   - Check webhook URL configuration
   - Verify webhook secret
   - Ensure WhatsApp is connected

2. **Media Not Uploading**
   - Check S3 credentials
   - Verify bucket permissions
   - Check network connectivity

3. **AI Processing Failing**
   - Verify Yandex Cloud credentials
   - Check API quotas
   - Review text content quality

4. **Database Errors**
   - Check database connection
   - Verify Prisma schema
   - Check for constraint violations

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` and check console output for detailed processing information.

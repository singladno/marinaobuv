# WhatsApp Message Fetching System

This system fetches messages from a specified WhatsApp group chat, processes them with YandexGPT, and stores them in the database with provider information.

## Features

✅ **Message Fetching**: Fetches messages from specified WhatsApp group chat using WHAPI
✅ **Provider Detection**: Automatically extracts provider names from sender names
✅ **Image Processing**: Downloads and uploads images to S3 storage
✅ **AI Processing**: Uses YandexGPT to extract product information from messages
✅ **Database Storage**: Stores messages, providers, and product drafts in PostgreSQL
✅ **Error Handling**: Comprehensive error handling and logging
✅ **No Message Sending**: System only fetches and processes, never sends messages

## Database Schema

### New Provider Entity
```sql
model Provider {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  WhatsAppMessage[]
  products  Product[]
}
```

### Updated WhatsAppMessage
- Added `providerId` field linking to Provider
- Added `provider` relation

### Updated Product
- Added `providerId` field linking to Provider
- Added `provider` relation

## Environment Variables Required

```bash
# WHAPI Configuration
WHAPI_BASE_URL="https://gate.whapi.cloud"
WHAPI_TOKEN="your_whapi_token"
WHAPI_WEBHOOK_SECRET="your_webhook_secret"

# Target Group Chat
TARGET_GROUP_ID="79296430333-1565970647@g.us"

# Yandex Cloud (for AI processing)
YC_FOLDER_ID="your_folder_id"
YC_IAM_TOKEN="your_iam_token"  # OR YC_API_KEY="your_api_key"

# S3 Storage (for images)
S3_ENDPOINT="https://storage.yandexcloud.net"
S3_REGION="ru-central1"
S3_BUCKET="your_bucket"
S3_ACCESS_KEY="your_access_key"
S3_SECRET_KEY="your_secret_key"
CDN_BASE_URL="https://your-cdn-domain.com"
```

## Usage

### 1. Test Message Fetching (No AI Processing)
```bash
npm run test:simple
```
This tests the WHAPI integration without requiring Yandex Cloud credentials.

### 2. Full Message Processing
```bash
npm run fetch:messages
```
This runs the complete pipeline:
- Fetches messages from the group chat
- Extracts provider names from sender names
- Downloads and uploads images to S3
- Processes text with YandexGPT
- Stores everything in the database

## File Structure

```
src/
├── lib/
│   ├── message-fetcher.ts          # WHAPI message fetching
│   ├── message-processor-extended.ts # Message processing logic
│   ├── provider-utils.ts           # Provider name extraction
│   └── ...
├── scripts/
│   ├── fetch-group-messages.ts     # Main processing script
│   ├── test-fetch-messages.ts      # Test with env validation
│   └── simple-test.ts              # Simple test without env validation
└── ...
```

## How It Works

### 1. Message Fetching
- Uses WHAPI `/messages/list/{chatId}` endpoint
- Fetches up to 100 messages at a time
- Handles different message types (text, image, sticker, etc.)

### 2. Provider Detection
- Extracts provider name from `pushName` field
- Cleans names (removes phone numbers, @ symbols)
- Creates or finds existing provider in database

### 3. Image Processing
- Downloads images from WHAPI URLs
- Uploads to S3 with proper MIME types
- Generates public CDN URLs

### 4. AI Processing
- Uses YandexGPT to extract product information
- Converts text to structured product data
- Handles various product attributes (price, size, material, etc.)

### 5. Database Storage
- Stores WhatsApp messages with provider links
- Creates product drafts from AI processing
- Maintains referential integrity

## Message Types Supported

- **Text Messages**: Processed with YandexGPT for product extraction
- **Image Messages**: Downloaded and stored in S3
- **Sticker Messages**: Stored as metadata
- **Unknown Messages**: Stored but not processed

## Error Handling

- Individual message processing errors don't stop the batch
- Comprehensive logging for debugging
- Graceful handling of missing credentials
- S3 upload failures are logged but don't stop processing

## Testing

The system includes multiple test levels:

1. **Simple Test**: Tests WHAPI connectivity only
2. **Environment Test**: Tests with full environment validation
3. **Full Processing**: Complete end-to-end processing

## Security

- **No Message Sending**: System only fetches and processes
- **Environment Variables**: All credentials stored securely
- **Error Logging**: Sensitive data not logged
- **Rate Limiting**: Built-in rate limiting for API calls

## Monitoring

The system provides detailed logging:
- Message processing progress
- Provider detection results
- Image upload status
- AI processing results
- Error counts and details

## Next Steps

To use this system in production:

1. Configure all environment variables
2. Set up Yandex Cloud credentials
3. Configure S3 storage
4. Run `npm run fetch:messages` to process messages
5. Monitor logs for any issues

The system is designed to be run periodically to fetch new messages from the group chat and process them automatically.

# Green API Integration Setup

This document explains how to set up and use Green API as an alternative to WHAPI for fetching WhatsApp group messages.

## Overview

Green API is a WhatsApp Business API service that allows you to:

- Fetch messages from group chats
- Get specific messages by ID
- Receive real-time webhooks
- Send messages (not covered in this setup)

## Prerequisites

1. **Green API Account**: Sign up at [green-api.com](https://green-api.com)
2. **WhatsApp Business Account**: You need a WhatsApp Business account
3. **Environment Variables**: Configure the required environment variables

## Setup Steps

### 1. Create Green API Instance

1. Go to [green-api.com](https://green-api.com) and create an account
2. Create a new instance
3. Note down your:
   - Instance ID
   - Token
   - Base URL (usually `https://api.green-api.com`)

### 2. Configure Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Green API Configuration
GREEN_API_INSTANCE_ID=your_instance_id_here
GREEN_API_TOKEN=your_token_here
GREEN_API_BASE_URL=https://api.green-api.com

# Target Group ID (same as WHAPI)
TARGET_GROUP_ID=120363123456789012@g.us
```

### 3. Install Dependencies

The required dependencies are already included in the project. No additional installation needed.

### 4. Test the Integration

Run the test script to verify everything is working:

```bash
cd web
npx tsx src/scripts/test-green-api.ts
```

This will:

- Test the connection to Green API
- Check if the instance is ready
- Enable required settings if needed
- Fetch a few messages from your target group
- Display the results

### 5. Fetch Messages

To fetch messages using Green API instead of WHAPI:

```bash
cd web
npx tsx src/scripts/fetch-messages-green-api.ts
```

This will:

- Fetch messages from the last 24 hours (configurable)
- Save them to your database
- Process them using your existing pipeline

## API Methods

### GreenApiFetcher Class

The `GreenApiFetcher` class provides the following methods:

#### `getChatHistory(params)`

Fetches chat history from a group chat.

```typescript
const messages = await greenApiFetcher.getChatHistory({
  chatId: '120363123456789012@g.us',
  count: 50,
});
```

#### `getMessage(params)`

Fetches a specific message by ID.

```typescript
const message = await greenApiFetcher.getMessage({
  chatId: '120363123456789012@g.us',
  idMessage: 'message_id_here',
});
```

#### `getSettings()`

Gets current instance settings.

```typescript
const settings = await greenApiFetcher.getSettings();
```

#### `setSettings(params)`

Updates instance settings.

```typescript
await greenApiFetcher.setSettings({
  incomingWebhook: true,
  outgoingWebhook: true,
  sendFromPhone: true,
});
```

#### `enableMessageFetching()`

Enables all required settings for message fetching.

```typescript
await greenApiFetcher.enableMessageFetching();
```

#### `isReady()`

Checks if the instance is ready for message fetching.

```typescript
const ready = await greenApiFetcher.isReady();
```

#### `fetchGroupMessages(chatId, limit, options)`

Fetches messages with pagination and filtering.

```typescript
const messages = await greenApiFetcher.fetchGroupMessages(
  '120363123456789012@g.us',
  100,
  {
    existingIds: new Set(['msg1', 'msg2']),
    maxMessages: 1000,
  }
);
```

## Message Format

Green API messages are automatically converted to the same format as WHAPI messages, so they work with your existing processing pipeline.

### Green API Message Structure

```typescript
interface GreenApiMessage {
  idMessage: string;
  timestamp: number;
  typeMessage: string;
  chatId: string;
  senderId?: string;
  senderName?: string;
  textMessage?: string;
  downloadUrl?: string;
  caption?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  // ... and more fields
}
```

## Integration with Existing System

The Green API integration is designed to work alongside your existing WHAPI system:

1. **Same Database Schema**: Messages are saved to the same `whatsAppMessage` table
2. **Same Processing Pipeline**: Messages go through the same parsing and processing logic
3. **Same Message Format**: Messages are converted to the same format as WHAPI messages

## Switching Between APIs

You can easily switch between WHAPI and Green API by:

1. **Using WHAPI**: Run your existing scripts (e.g., `fetch-recent-messages.ts`)
2. **Using Green API**: Run the new Green API scripts (e.g., `fetch-messages-green-api.ts`)

## Troubleshooting

### Common Issues

1. **"Instance not ready"**
   - Wait a few minutes for the instance to initialize
   - Check if your WhatsApp is connected to the instance
   - Run `enableMessageFetching()` to configure settings

2. **"No messages fetched"**
   - Verify your group chat ID is correct (should end with `@g.us`)
   - Check if the instance is connected to WhatsApp
   - Ensure the group has recent messages

3. **"Authentication failed"**
   - Verify your instance ID and token are correct
   - Check if the instance is active and not expired

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=green-api
```

### Checking Instance Status

You can check your instance status at [green-api.com](https://green-api.com) in your dashboard.

## Performance Considerations

- **Rate Limits**: Green API has rate limits, so don't fetch too many messages at once
- **Pagination**: Use the `fetchGroupMessages` method for large message counts
- **Caching**: Consider implementing message ID caching to avoid duplicates

## Webhooks (Future Enhancement)

Green API supports webhooks for real-time message receiving. This could be implemented to replace the polling mechanism used by WHAPI.

## Support

- **Green API Documentation**: [green-api.com/en/docs](https://green-api.com/en/docs)
- **Green API Support**: Contact through their website
- **Project Issues**: Create an issue in this repository

## Cost Comparison

Compare the costs between WHAPI and Green API to determine which is more cost-effective for your use case:

- **WHAPI**: Pay per message/request
- **Green API**: Pay per instance/month

Consider your message volume and frequency when choosing between the two.

# Green API Webhook Setup for Media URLs

## 🎯 **Problem Solved**

The issue with missing image URLs is that **Green API only provides `downloadUrl` through webhooks**, not through the `getChatHistory` API method.

## 🔧 **Solution: Webhook Integration**

### **1. Webhook Endpoint Created**

- **File**: `src/app/api/webhooks/green-api.ts`
- **URL**: `https://your-domain.com/api/webhooks/green-api`
- **Purpose**: Captures incoming messages with media URLs in real-time

### **2. Webhook Setup Script**

- **File**: `src/scripts/setup-green-api-webhook.ts`
- **Command**: `npm run webhook:setup`
- **Purpose**: Configures Green API to send webhooks to your endpoint

## 🚀 **Setup Instructions**

### **Step 1: Update Webhook URL**

Edit `src/scripts/setup-green-api-webhook.ts` and replace:

```typescript
const webhookUrl = 'https://your-domain.com/api/webhooks/green-api';
```

With your actual domain.

### **Step 2: Deploy Your Application**

Make sure your webhook endpoint is accessible from the internet:

- Deploy to Vercel, Railway, or your preferred platform
- Ensure the `/api/webhooks/green-api` endpoint is public

### **Step 3: Configure Green API**

Run the setup script:

```bash
npm run webhook:setup
```

### **Step 4: Test**

1. Send an image message to your WhatsApp group
2. Check the database for messages with `mediaUrl` populated
3. Verify the webhook is receiving and processing messages

## 📋 **Webhook Payload Structure**

When a message with media is received, the webhook will receive:

```json
{
  "typeWebhook": "incomingMessageReceived",
  "messageData": {
    "typeMessage": "imageMessage",
    "fileMessageData": {
      "downloadUrl": "https://api.green-api.com/waInstance.../downloadFile/...",
      "caption": "Image caption",
      "fileName": "image.jpg",
      "mimeType": "image/jpeg",
      "jpegThumbnail": "base64_thumbnail_data"
    }
  }
}
```

## 🔍 **Database Changes**

The webhook handler will save messages with:

- ✅ **`mediaUrl`**: Direct download link from Green API
- ✅ **`mediaMimeType`**: File type (image/jpeg, video/mp4, etc.)
- ✅ **`mediaCaption`**: Image caption if provided
- ✅ **`mediaThumbnail`**: Base64 thumbnail data

## 🎯 **Benefits**

1. **Real-time capture**: Media URLs captured as messages are sent
2. **No expiration**: URLs are captured before they expire
3. **Complete data**: All media metadata is preserved
4. **Automatic processing**: Messages are saved to database immediately

## 🔧 **Current Status**

- ✅ Webhook endpoint created
- ✅ Webhook setup script created
- ✅ Database schema supports media URLs
- ⏳ **Next**: Deploy and configure webhook URL
- ⏳ **Next**: Test with real messages

## 💡 **Alternative: Use Existing Messages**

If you can't set up webhooks immediately, you can:

1. **Use thumbnail data**: The `jpegThumbnail` field contains base64 image previews
2. **Focus on text processing**: Process text messages for now
3. **Set up webhooks later**: For future message capture

## 🚨 **Important Notes**

- **Webhook URLs must be HTTPS** (Green API requirement)
- **Webhook must be publicly accessible** from the internet
- **Media URLs expire** after 24-48 hours, so webhooks are essential
- **Test thoroughly** before going to production

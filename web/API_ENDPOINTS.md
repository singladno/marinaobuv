# WhatsApp Message API Endpoints

This document describes the API endpoints for retrieving WhatsApp message history from group chats.

## 📋 **Available Endpoints**

### 1. List All Groups
**GET** `/api/groups`

Returns a list of all WhatsApp groups that have received messages.

**Response:**
```json
{
  "success": true,
  "totalGroups": 2,
  "groups": [
    {
      "groupId": "120363123456789012@g.us",
      "messageCount": 2,
      "firstMessageAt": "2025-09-14T17:25:36.754Z",
      "lastMessageAt": "2025-09-14T17:25:42.643Z",
      "latestSender": "Михаил Иванов",
      "latestMessagePreview": "Черные ботинки, размер 42, цена 8000 рублей"
    }
  ]
}
```

### 2. Get Group Message History
**GET** `/api/messages/group/{groupId}`

Retrieves message history from a specific group chat.

**Parameters:**
- `groupId` (path): WhatsApp group ID (must end with `@g.us`)
- `limit` (query, optional): Number of messages to return (default: 50, max: 100)
- `offset` (query, optional): Number of messages to skip (default: 0)
- `includeDrafts` (query, optional): Include AI-processed product drafts (default: false)

**Example:**
```
GET /api/messages/group/120363123456789012@g.us?limit=10&offset=0&includeDrafts=true
```

**Response:**
```json
{
  "success": true,
  "groupId": "120363123456789012@g.us",
  "pagination": {
    "total": 2,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  },
  "statistics": {
    "totalMessages": 2,
    "messageTypes": {
      "conversation": 2
    }
  },
  "messages": [
    {
      "id": "cmfjyupv60008w6vdjx31uhoz",
      "waMessageId": "group-test-002",
      "remoteJid": "120363123456789012@g.us",
      "fromMe": false,
      "pushName": "Михаил Иванов",
      "messageType": "conversation",
      "text": "Черные ботинки, размер 42, цена 8000 рублей",
      "mediaUrl": null,
      "mediaS3Key": null,
      "createdAt": "2025-09-14T17:25:42.643Z",
      "productDraft": {
        "name": "Черные ботинки",
        "article": null,
        "season": null,
        "pricePair": 800000,
        "material": "кожа",
        "gender": null
      }
    }
  ]
}
```

### 3. Get All Messages (Recent)
**GET** `/api/messages`

Returns the most recent messages from all groups.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "messages": [
    {
      "id": "cmfjyupv60008w6vdjx31uhoz",
      "waMessageId": "group-test-002",
      "remoteJid": "120363123456789012@g.us",
      "fromMe": false,
      "pushName": "Михаил Иванов",
      "messageType": "conversation",
      "text": "Черные ботинки, размер 42, цена 8000 рублей",
      "mediaUrl": null,
      "createdAt": "2025-09-14T17:25:42.643Z"
    }
  ]
}
```

## 🔍 **Usage Examples**

### Get All Groups
```bash
curl http://localhost:3000/api/groups
```

### Get Messages from Specific Group
```bash
curl "http://localhost:3000/api/messages/group/120363123456789012@g.us"
```

### Get Paginated Messages
```bash
curl "http://localhost:3000/api/messages/group/120363123456789012@g.us?limit=5&offset=10"
```

### Get Messages with Product Drafts
```bash
curl "http://localhost:3000/api/messages/group/120363123456789012@g.us?includeDrafts=true"
```

## 📊 **Message Types**

The system supports various WhatsApp message types:
- `conversation`: Text messages
- `imageMessage`: Images with optional captions
- `videoMessage`: Videos with optional captions
- `documentMessage`: Documents with optional captions
- `extendedTextMessage`: Rich text messages

## 🔒 **Security**

- All endpoints require valid authentication
- Group IDs are validated to ensure they end with `@g.us`
- Pagination limits prevent excessive data retrieval
- Input validation prevents SQL injection

## 📈 **Performance**

- Messages are ordered by creation date (newest first)
- Pagination reduces memory usage for large groups
- Database indexes optimize query performance
- Response times are typically under 100ms for small groups

/**
 * WhatsApp Message Grouping Prompts
 * Used for grouping related messages into product sequences
 */

export const GROUPING_SYSTEM_PROMPT = `You are an expert at analyzing WhatsApp messages to identify product sequences.

GROUP MESSAGES BY PRODUCT:

CORE REQUIREMENTS:
- Each group MUST have: 1+ text message + 1+ image
- Messages from same product come in sequence from same user
- Skip incomplete groups (images only or text only)
- MAXIMUM 10 messages per group (typically 4-8 messages per product)

PRODUCT SEQUENCE DETECTION (CRITICAL):
A product sequence is: [Text] → [Images] = ONE PRODUCT
OR [Images] → [Text] = ONE PRODUCT

SEQUENCE BREAK DETECTION:
- If you see: [Text] → [Images] → [Text] → [Images] = TWO SEPARATE PRODUCTS
- If you see: [Images] → [Text] → [Images] → [Text] = TWO SEPARATE PRODUCTS
- Each complete text+images sequence = ONE product
- Look for natural breaks in the message flow
- Time gaps of 20+ seconds often indicate new sequences
- Different products from same sender should be separate groups

COMMON PATTERNS:
1. Single product: [Text] → [Image] (4-6 messages)
2. Multiple products: [Text] → [Image] → [Text] → [Image] (6+ messages = 2 products)
3. Mixed pattern: [Text] → [Text] → [Image] → [Image] → [Text] → [Image] (6+ messages = 2 products)

STRICT GROUPING RULES:
- EVERY group MUST contain BOTH images AND text messages — this is MANDATORY
- Groups with ONLY images are INVALID — they must be skipped entirely
- Groups with ONLY text are INVALID — they must be skipped entirely
- MAXIMUM 10 messages per group (enforced strictly)
- A group can have 1-3 text messages describing the same product
- A group can have 1-5 images of the same product
- Use timestamp field: messages sent within 1-2 seconds are usually same product
- Time gaps of 30+ seconds often indicate different products
- Look for natural breaks in message flow and topic changes
- Different products from same sender should be separate groups
- Provider greetings go with the NEXT product messages

SEQUENCE VALIDATION:
- If you see text+images pattern, create separate groups
- Each group should represent ONE complete product sequence
- When in doubt, create MORE groups rather than fewer
- Skip incomplete sequences (missing text or images)
- CRITICAL: Each text+images sequence = ONE product
- CRITICAL: Look for sequence breaks: [Text+Images] → [Text+Images] = TWO PRODUCTS

Return JSON format:
{
  "groups": [
    {
      "groupId": "group_1",
      "messageIds": ["msg_id_1", "msg_id_4"],
      "productContext": "Brief description of the product",
      "confidence": 0.9
    }
  ]
}

VALIDATION RULES:
- Each group MUST have 2-6 messages. Rarely 7-10 messages.
- Each group MUST have both text and image messages
- If a group has >10 messages, analyze timestamps and split into multiple groups if needed
- If you see text+images+text+images pattern, create separate groups
- Each group represents ONE complete product sequence`;

export const GROUPING_USER_PROMPT = (messagesText: string) =>
  `Analyze these WhatsApp messages and group them by product:

${messagesText}

CRITICAL INSTRUCTIONS:
- Each text+images sequence = ONE product
- Look for sequence patterns: [Text+Images] → [Text+Images] = TWO SEPARATE PRODUCTS
- When in doubt, create MORE groups rather than fewer
- Each group must have both text and image messages
- Focus on the SEQUENCE of text and images, not the content

Return JSON with groups array. Each group must have both text and image messages.`;

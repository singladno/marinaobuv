export const GROUPING_RULES = `
GROUP MESSAGES BY PRODUCT:

CORE REQUIREMENTS:
- Each group MUST have: 1+ text message + 1+ image
- Messages from same product come in sequence from same user
- Skip incomplete groups (images only or text only)

COMMON PATTERNS:
1. Text first, then images: [Text] → [Image] → [Image] → [Image]
2. Images first, then text: [Image] → [Image] → [Text]
3. Multiple text messages: [Text] → [Text] → [Image] → [Image]
4. Mixed pattern: [Image] → [Text] → [Text] → [Image] → [Text]


GROUPING RULES:
- EVERY group MUST contain BOTH images AND text messages — this is MANDATORY
- Groups with ONLY images are INVALID — they must be skipped entirely
- Groups with ONLY text are INVALID — they must be skipped entirely
- A group can have 2-3 text messages describing the same product
- A group can have multiple images of the same product. Usually from 1 to 5 images.
- Use timestamp field: messages sent within 1-2 seconds are usually same product
- Time gaps of 30+ seconds often indicate different products
- Look for natural breaks in message flow
- Different products from same sender should be separate groups
- Provider greetings go with the NEXT product messages

VALIDATION:
- Every group needs both text and images
- If you can't form a complete group, skip those messages
- When in doubt, separate products rather than mixing them
`;

export const GROUPING_RESPONSE_FORMAT = `
RESPONSE (JSON only):
{
  "groups": [
    {
      "groupId": "group_1", 
      "messageIds": ["msg_id_1", "msg_id_4"],
      "productContext": "Brief description of the product",
      "confidence": Number
    }
  ]
}`;

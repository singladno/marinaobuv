/**
 * OpenAI prompt for grouping WhatsApp messages by product
 */
export function createGroupingPrompt(messages: any[]): string {
  return `Group WhatsApp messages by product. Analyze message patterns and timestamps to create accurate product groups.

MESSAGES:
${JSON.stringify(messages, null, 1)}

CRITICAL RULES:
1. Group messages by product - analyze content to determine what belongs together
2. If you see many messages from same provider, they likely contain MULTIPLE different products
3. Use timeAgo field to determine grouping - messages for same product are usually sent close together in time
4. Analyze imageUrl field when in doubt - different products will have visually different images
5. Separate different products even from same sender - one provider can send multiple products
6. Look for price changes, different product names, or different visual content to separate products
7. When provider sends many messages quickly, analyze image content to determine product boundaries
8. CRITICAL PATTERN: text - images - text - images from same provider = 2 DIFFERENT products
9. TIMING ANALYSIS: Messages for same product are sent within minutes of each other
10. When you see alternating text-image patterns, split them into separate groups

ALTERNATING PATTERN DETECTION (CRITICAL):
- PATTERN: [Text] + [Images] + [Text] + [Images] from same provider = 2 DIFFERENT products
- ALWAYS split alternating text-image patterns into separate groups
- Each text-image sequence represents a different product
- Example: [Text A] + [Images A] + [Text B] + [Images B] → Group 1: [Text A] + [Images A], Group 2: [Text B] + [Images B]

TIMING ANALYSIS (CRITICAL):
- Messages for same product are sent within 1-5 minutes of each other
- If there's a gap of 10+ minutes between messages, they likely belong to different products
- Use timeAgo field to determine timing relationships
- Same product messages cluster together in time
- Different products have time gaps between their message sequences

MIXED SEQUENCE PATTERN (CRITICAL):
- NEVER group images from different products together
- If you see: [Images] + [Text] + [More Images], analyze which images the text describes
- USE TIMING ANALYSIS to determine which images the text describes
- EDGE CASE: Single image at start might be cut from previous batch
  * If you see: [Single Image] + [Text] + [Multiple Images] → the single image might be orphaned
  * Check if single image has similar timing to the text and multiple images
  * If timing suggests it belongs with the text, group them together
  * If timing suggests it's orphaned, skip it (don't create incomplete groups)
- CRITICAL: NEVER create groups with only images or only text - they are INVALID
- If you cannot form a complete group (images + text), skip those messages entirely
- It's better to skip incomplete groups than to create invalid ones
- Only create groups where text descriptions clearly match the images
- When in doubt, err on the side of separating products rather than mixing them

IMAGE LIMIT RULE (CRITICAL):
- Groups should NOT contain more than 8 images maximum
- If a group has more than 8 images, it likely contains multiple different products
- Split large groups based on timestamp gaps and visual content differences
- Most single products are represented by 2-4 images, rarely more than 8

VALID GROUP REQUIREMENTS (STRICT):
- EVERY group MUST contain BOTH images AND text messages - this is MANDATORY
- ABSOLUTELY FORBIDDEN: Groups with only images OR only text - these are INVALID and must be skipped
- If you cannot form a complete group (images + text), skip those messages entirely
- CRITICAL: Use timing analysis (timeAgo field) to determine which images the text describes
- Use timing analysis (timeAgo field) to determine which images the text describes
- If text timing suggests it describes different images, split the group accordingly
- When in doubt about which images a text describes, use timing analysis first, then err on the side of separation

RESPONSE (JSON only):
{
  "groups": [
    {
      "groupId": "group_1", 
      "messageIds": ["msg_id_1", "msg_id_4"],
      "productContext": "Brief description of the product",
      "confidence": 0.95
    }
  ]
}`;
}

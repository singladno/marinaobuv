/**
 * Create the GPT prompt for message grouping
 */
export function createGroupingPrompt(
  messagesForGPT: Array<{
    id: string;
    index: number;
    sender: string;
    type: string;
    text: string;
    hasImage: boolean;
    imageUrl: string | null;
    timestamp: string;
    timeAgo: string;
  }>
): string {
  return `Group WhatsApp messages by product. Analyze message patterns and timestamps to create accurate product groups.

MESSAGES:
${JSON.stringify(messagesForGPT, null, 1)}

CRITICAL RULES:
1. Group messages by product - analyze content to determine what belongs together
2. If you see many messages from same provider, they likely contain MULTIPLE different products
3. Use timeAgo field to determine grouping - messages for same product are usually sent close together in time
4. Analyze imageUrl field when in doubt - different products will have visually different images
5. Separate different products even from same sender - one provider can send multiple products
6. Look for price changes, different product names, or different visual content to separate products
7. When provider sends many messages quickly, analyze image content to determine product boundaries
8. Provider greetings should be grouped with the NEXT product messages, not as separate groups

IMAGE LIMIT RULE (CRITICAL):
- Groups should NOT contain more than 5-6 images maximum
- If a group has more than 6 images, it likely contains multiple different products
- Split large groups based on timestamp gaps and visual content differences
- Most single products are represented by 2-4 images, rarely more than 6

TIMESTAMP ANALYSIS (ENHANCED):
- Messages for the same product are typically sent within 1-5 minutes of each other
- Time gaps of 10+ minutes often indicate different products
- Time gaps of 30+ minutes almost certainly indicate different products
- Look for natural breaks in message flow - these often separate different products
- If you see a cluster of images followed by a long pause, then more messages, split at the pause

SEQUENCE PATTERN ANALYSIS (CRITICAL):
- Images of the same product are usually sent in a continuous sequence
- Look for the pattern: [Image] + [Image] + [Image] + [Text] + [Image] + [Image] + [Image] + [Text]
- This pattern indicates TWO different products - split at the text message boundary
- Common patterns that indicate different products:
  * 3 images → text → 3 images → text (2 different products)
  * 2 images → text → 4 images → text (2 different products)  
  * 1 image → text → 2 images → text (2 different products)
- The text message acts as a separator between different product sequences
- If you see repeated image-text-image-text patterns, create separate groups for each sequence
- Each continuous image sequence (followed by text) represents one product

VALID GROUP REQUIREMENTS (STRICT):
- EVERY group MUST contain BOTH images AND text messages - this is MANDATORY
- Groups with ONLY images are INVALID - they cannot be processed into products
- Groups with ONLY text are INVALID - they cannot be processed into products
- Text messages MUST include: price, sizes, amount, or product descriptions
- Images MUST show the actual product being described in the text
- Each group must be a complete product unit that can be processed into a catalog entry
- If you cannot create a group with both images and text, DO NOT create that group

GROUPING STRATEGY:
- FIRST: Analyze sequence patterns - look for image-text-image-text patterns that indicate different products
- SECOND: Start with timeAgo analysis - group messages that are close in time (within 5 minutes)
- For each time cluster, analyze if images show the same product (check imageUrl field)
- If images are different, split into separate product groups
- If text mentions different prices/products, split accordingly
- Pay special attention to timeAgo gaps - gaps of 10+ minutes often indicate different products
- PRIORITIZE sequence analysis: If you see [Image][Image][Image][Text][Image][Image][Image][Text], create TWO groups
- Group 1: [Image][Image][Image][Text] (first product)
- Group 2: [Image][Image][Image][Text] (second product)
- The text message acts as a natural separator between different product sequences
- If you see sequential image messages followed by one description text message, group them together as one product group
- The description text message should be included with all the preceding image messages in the same group
- This ensures no data is lost when providers send multiple individual image messages with shared descriptions
- Example: Message1[Image] + Message2[Image] + Message3[Image] + Message4[Text] = One product group
- ENFORCE the 5-6 image limit - if a group exceeds this, split it based on timestamps and content
- ENFORCE sequence patterns - split at text message boundaries when you see repeated image-text patterns
- CRITICAL: Only create groups that have BOTH images AND text - incomplete groups are useless for product processing

VALIDATION RULES (MANDATORY):
- Before creating any group, verify it contains at least 1 image AND at least 1 text message
- Text messages must contain product information (price, sizes, description, etc.)
- Images must show the product being described in the text
- If a group would only have images OR only text, DO NOT create that group
- It's better to have fewer, complete groups than many incomplete groups
- Each group must be processable into a complete product catalog entry

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

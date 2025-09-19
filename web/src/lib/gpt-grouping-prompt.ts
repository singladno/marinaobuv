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

VALID GROUP REQUIREMENTS (FLEXIBLE):
- PREFER groups with both images AND text messages
- Text messages SHOULD include: price, sizes, amount, or product descriptions
- Groups with ONLY images can be VALID if they show clear product content
- Groups with ONLY text can be VALID if they contain detailed product information
- Groups with product-related content (shoe types, materials, descriptions) are VALID
- Create groups that have meaningful product content (visual or textual)

GROUPING STRATEGY:
- Start with timeAgo analysis - group messages that are close in time
- For each time cluster, analyze if images show the same product (check imageUrl field)
- If images are different, split into separate product groups
- If text mentions different prices/products, split accordingly
- Pay special attention to timeAgo gaps - large gaps often indicate different products
- If you see sequential image messages followed by one description text message, group them together as one product group
- The description text message should be included with all the preceding image messages in the same group
- This ensures no data is lost when providers send multiple individual image messages with shared descriptions
- Example: Message1[Image] + Message2[Image] + Message3[Image] + Message4[Text] = One product group

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
